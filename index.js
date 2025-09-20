#!/usr/bin/env node

const fs = require("fs/promises");
const path = require("path");
const { existsSync } = require("fs");

const templates = {
  serverJS: function (projectName) {
    return `const dotenv = require("dotenv");
dotenv.config();
const app = require("./src/app.js");
const { connectDB } = require("./src/config/db.js");
const { PORT } = require("./src/config/constants.js");

const start = async () => {
  await connectDB();
  app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
};

start().catch((err) => {
  console.error(err);
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

// default API prefix if not provided
const API_VERSION = process.env.API_VERSION || "/api/v1";

// mount top-level router (routes/index.js should export an express router)
app.use(API_VERSION, require("./routes/index"));

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

module.exports = {
  PORT,
  MONGO_URI,
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

  globalError: `require("dotenv").config();
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
`,

  readme: function (projectName) {
    return `# ${projectName}
Generated by create-backend-app

## Setup
1. Install dependencies:
\`\`\`bash
npm install
\`\`\`
2. Create a .env with:
MONGO_URI=<your mongodb uri>
OPTIONAL: NODE_ENV=development
OPTIONAL: API_VERSION=/api/v1

3. Run:
\`\`\`bash
npm run dev
\`\`\`
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
          start: "node server.js",
          dev: "nodemon server.js",
        },
        dependencies: {
          express: "^4.18.2",
          mongoose: "^7.0.0",
          dotenv: "^16.0.0",
          cors: "^2.8.5",
          morgan: "^1.10.0",
        },
        devDependencies: {
          nodemon: "^3.1.10",
        },
      },
      null,
      2
    );
  },
};

async function writeFileSafe(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

const argv = process.argv.slice(2);
const projectName = argv[0];

if (!projectName) {
  console.log("Usage: create-backend-app <project-name>");
  process.exit(1);
}

const target = path.resolve(process.cwd(), projectName);
if (existsSync(target)) {
  console.error("Folder already exists:", target);
  process.exit(1);
}

(async () => {
  try {
    // create directories and files
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
      await fs.mkdir(path.join(target, d), { recursive: true });
    }

    // write files
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
    await writeFileSafe(
      path.join(target, "src/models/User.js"),
      templates.userModel
    );
    await writeFileSafe(
      path.join(target, "src/models/Post.js"),
      templates.postModel
    );
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

    console.log("✅ Project created at", target);
    console.log("Next steps:");
    console.log(`  cd ${projectName}`);
    console.log("  npm install");
    console.log("  create a .env file with MONGO_URI and run npm run dev");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
