#!/usr/bin/env node
// javascript
const fs = require("fs/promises");
const path = require("path");
const {existsSync} = require("fs");
const {Command} = require("commander");
const chalk = require("chalk");
const ora = require("ora");
const pkg = require("./package.json");
const templates = {
    serverJS: function (projectName) {
        return `
const app = require("./src/app.js");
const { connectDB } = require("./src/config/db.js");
const { PORT } = require("./src/config/constants.js");

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(\`🚀 Server running on port \${PORT}\`));
};

start().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
`;
    },

    appJS: `const express = require("express");
const { globalErrorHandler } = require("./helpers/globalError");
const cors = require("cors");
const morgan = require("morgan");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(morgan("dev"));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// default API prefix if not provided
const API_VERSION = process.env.API_VERSION || "/api/v1";

// mount top-level router (routes/index.js should export an express router)
app.use(API_VERSION, require("./routes/index"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    statusCode: 404,
    message: "Route not found",
    status: "error"
  });
});

// global error handler
app.use(globalErrorHandler);

module.exports = app;
`,

    dbJS: function (projectName) {
        return `const mongoose = require("mongoose");
const { MONGO_URI } = require("./constants.js");

const connectDB = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI not set in environment");
    }
    const connection = await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected:", connection.connection.host);
  } catch (err) {
    console.error("❌ Error connecting to DB:", err.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
`;
    },

    constantsJS: function (projectName) {
        return `const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/${
            projectName || "myapp"
        }";
const NODE_ENV = process.env.NODE_ENV || "development";
const API_VERSION = process.env.API_VERSION || "/api/v1";

module.exports = {
  PORT,
  MONGO_URI,
  NODE_ENV,
  API_VERSION,
};
`;
    },

    asyncHandler: `const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};
module.exports = { asyncHandler };
`,

    customError: `class CustomError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.message = message || "Something went wrong";
    this.statusCode = statusCode;
    this.data = null;
    this.status = statusCode >= 400 && statusCode < 500 ? "client error" : "server error";
    this.isOperational = true;
    Error.captureStackTrace(this, CustomError);
  }
}
module.exports = { CustomError };
`,

    developmentError: `const developmentError = (err, res) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message,
    stack: err.stack,
    status: err.status || (statusCode >= 400 && statusCode < 500 ? "client error" : "server error"),
    isOperational: err.isOperational || false,
    data: err.data || null,
  });
};

module.exports = developmentError;
`,

    productionError: `const productionError = (err, res) => {
  const statusCode = err.statusCode || 500;
  if (err.isOperational) {
    res.status(statusCode).json({
      statusCode,
      message: err.message,
      status: err.status || "error",
    });
  } else {
    console.error("Unexpected error:", err);
    res.status(500).json({
      statusCode: 500,
      message: "Something went wrong",
      status: "error",
    });
  }
};

module.exports = productionError;
`,

    globalError: `
const developmentError = require("./developmentError");
const productionError = require("./productionError");

const globalErrorHandler = (err, req, res, next) => {
  // normalize basic props
  err.statusCode = err.statusCode || 500;
  err.status = err.status || (err.statusCode >= 400 && err.statusCode < 500 ? "client error" : "server error");

  if (process.env.NODE_ENV === "development") {
    developmentError(err, res);
  } else {
    productionError(err, res);
  }
};

module.exports = { globalErrorHandler };
`,

    apiResponse: `// controllers call: success(res, data, message, statusCode?)
function success(res, data = {}, message = "Success", statusCode = 200) {
  const response = {
    message,
    data,
    statusCode,
    status: statusCode >= 200 && statusCode < 300 ? "success" : "error",
  };
  return res.status(statusCode).json(response);
}

module.exports = { success };
`,

    userController: `const { asyncHandler } = require("../helpers/asyncHandler");
const { success } = require("../helpers/apiResponse");

// demo controller
const getUsers = asyncHandler(async (req, res) => {
  // placeholder: fetch users from DB
  success(res, [{ id: 1, name: "Demo User" }], "Users fetched");
});

module.exports = { getUsers };
`,

    authController: `const { asyncHandler } = require("../helpers/asyncHandler");
const { success } = require("../helpers/apiResponse");

const login = asyncHandler(async (req, res) => {
  // placeholder: perform login
  success(res, { token: "demo-token" }, "Logged in");
});

module.exports = { login };
`,

    indexRoutes: `const express = require("express");
const router = express.Router();

// mount api sub-routers (these are under src/routes/api)
const userRouter = require("./api/userRoutes");
const authRouter = require("./api/authRoutes");

router.use("/users", userRouter);
router.use("/auth", authRouter);

module.exports = router;
`,

    userApiRoutes: `const express = require("express");
const { getUsers } = require("../../controllers/userController");
const router = express.Router();

router.route("/").get(getUsers);

module.exports = router;
`,

    authApiRoutes: `const express = require("express");
const { login } = require("../../controllers/authController");
const router = express.Router();

router.route("/login").post(login);

module.exports = router;
`,

    userModel: `const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
`,

    postModel: `const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: String,
    content: String,
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
`,

    gitignore: `node_modules
.env
dist
npm-debug.log
*.log
.DS_Store
coverage
`,

    readme: function (projectName) {
        return `# ${projectName}
Generated by **nur-create-backend**

## 🚀 Quick Start

### 1. Install dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Setup environment
\`\`\`bash
cp .env.example .env
\`\`\`

Edit \`.env\` with your MongoDB URI and other settings.

### 3. Run the app
\`\`\`bash
npm run dev
\`\`\`

## 📋 Available Scripts

- \`npm start\` - Start the server in production mode
- \`npm run dev\` - Start (auto-reload)

## 🌐 API Endpoints

- **Health Check**: \`GET /health\`
- **Get Users**: \`GET /api/v1/users\`
- **Login**: \`POST /api/v1/auth/login\`

## 📁 Project Structure

\`\`\`
${projectName}/
├── server.js           # Entry point
├── src/
│   ├── app.js          # Express app setup
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── helpers/        # Utility functions
│   ├── models/         # Mongoose models
│   ├── routes/         # API routes
│   └── middlewares/    # Custom middlewares
├── tests/              # Test files
└── public/             # Static files
\`\`\`

## 🔐 Environment Variables

See \`.env.example\` for required environment variables.

## 📝 License

MIT
`;
    },

    packageJSON: function (projectName) {
        return JSON.stringify(
            {
                name: projectName,
                version: "0.1.0",
                private: true,
                main: "server.js",
                scripts: {
                    start: "node --env-file=.env server.js",
                    dev: "node --env-file=.env --watch server.js"
                },
                dependencies: {
                    express: "^4.18.2",
                    mongoose: "^7.0.0",
                    cors: "^2.8.5",
                    morgan: "^1.10.0",
                },
                devDependencies: {},
            },
            null,
            2
        );
    },

    envExample: function (projectName) {
        return `# MongoDB Connection
MONGO_URI=mongodb://127.0.0.1:27017/${projectName || "myapp"}

# Environment
NODE_ENV=development

# API Configuration
API_VERSION=/api/v1
PORT=5000

# Add your JWT secret, API keys, etc.
# JWT_SECRET=your-secret-key-here
`;
    },
};

async function writeFileSafe(filePath, content) {
    await fs.mkdir(path.dirname(filePath), {recursive: true});
    await fs.writeFile(filePath, content, "utf8");
}

// Initialize Commander
const program = new Command();

program
    .name("nur-create-backend")
    .description("🛠️  CLI to scaffold a production-ready Express + MongoDB backend")
    .version(pkg.version)
    .argument("<project-name>", "Name of your project")
    .option("-v, --verbose", "Show detailed output")
    .action(async (projectName, options) => {
        const target = path.resolve(process.cwd(), projectName);

        // Check if folder exists
        if (existsSync(target)) {
            console.log(chalk.red("❌ Error:"), `Folder "${projectName}" already exists!`);
            console.log(chalk.yellow("💡 Tip:"), "Choose a different project name");
            process.exit(1);
        }

        console.log(chalk.cyan.bold("\n🚀 Creating your backend app...\n"));

        const spinner = ora("Setting up folder structure...").start();

        try {
            // Create directories
            const dirs = [
                "src/config",
                "src/controllers",
                "src/routes",
                "src/routes/api",
                "src/models",
                "src/middlewares",
                "src/services",
                "src/utils",
                "src/helpers",
                "tests",
                "public",
            ];

            for (const d of dirs) {
                await fs.mkdir(path.join(target, d), {recursive: true});
            }

            spinner.text = "Writing configuration files...";

            // Write files
            await writeFileSafe(
                path.join(target, "server.js"),
                templates.serverJS(projectName)
            );
            await writeFileSafe(path.join(target, "src/app.js"), templates.appJS);
            await writeFileSafe(
                path.join(target, "src/config/db.js"),
                templates.dbJS(projectName)
            );
            await writeFileSafe(
                path.join(target, "src/config/constants.js"),
                templates.constantsJS(projectName)
            );

            spinner.text = "Creating helper functions...";

            await writeFileSafe(
                path.join(target, "src/helpers/asyncHandler.js"),
                templates.asyncHandler
            );
            await writeFileSafe(
                path.join(target, "src/helpers/customError.js"),
                templates.customError
            );
            await writeFileSafe(
                path.join(target, "src/helpers/developmentError.js"),
                templates.developmentError
            );
            await writeFileSafe(
                path.join(target, "src/helpers/productionError.js"),
                templates.productionError
            );
            await writeFileSafe(
                path.join(target, "src/helpers/globalError.js"),
                templates.globalError
            );
            await writeFileSafe(
                path.join(target, "src/helpers/apiResponse.js"),
                templates.apiResponse
            );

            spinner.text = "Setting up controllers and routes...";

            await writeFileSafe(
                path.join(target, "src/controllers/userController.js"),
                templates.userController
            );
            await writeFileSafe(
                path.join(target, "src/controllers/authController.js"),
                templates.authController
            );
            await writeFileSafe(
                path.join(target, "src/routes/index.js"),
                templates.indexRoutes
            );
            await writeFileSafe(
                path.join(target, "src/routes/api/userRoutes.js"),
                templates.userApiRoutes
            );
            await writeFileSafe(
                path.join(target, "src/routes/api/authRoutes.js"),
                templates.authApiRoutes
            );

            spinner.text = "Creating database models...";

            await writeFileSafe(
                path.join(target, "src/models/User.js"),
                templates.userModel
            );
            await writeFileSafe(
                path.join(target, "src/models/Post.js"),
                templates.postModel
            );

            spinner.text = "Finalizing project setup...";

            await writeFileSafe(path.join(target, ".gitignore"), templates.gitignore);
            await writeFileSafe(
                path.join(target, "README.md"),
                templates.readme(projectName)
            );
            await writeFileSafe(
                path.join(target, "package.json"),
                templates.packageJSON(projectName)
            );
            await writeFileSafe(path.join(target, "public/.gitkeep"), "");
            await writeFileSafe(
                path.join(target, ".env.example"),
                templates.envExample(projectName)
            );

            spinner.succeed(chalk.green("✅ Project created successfully!"));

            // Success message
            console.log(chalk.cyan("\n📦 Next steps:\n"));
            console.log(chalk.white(`  cd ${chalk.yellow(projectName)}`));
            console.log(chalk.white(`  ${chalk.yellow("npm install")}`));
            console.log(
                chalk.white(
                    `  ${chalk.yellow("cp .env.example .env")}  ${chalk.gray("# Edit with your values")}`
                )
            );
            console.log(chalk.white(`  ${chalk.yellow("npm run dev")}\n`));
            console.log(chalk.green("🎉 Happy coding!\n"));
        } catch (err) {
            spinner.fail(chalk.red("❌ Error creating project"));
            console.error(chalk.red("\nError details:"), err.message);
            if (options.verbose) {
                console.error(err);
            }
            process.exit(1);
        }
    });

program.parse();
