# nur-create-backend

A zero‑configuration CLI to scaffold a structured Express + MongoDB backend with clean architecture helpers, routing, error handling, and sample models/controllers.

![npm version](https://img.shields.io/npm/v/nur-create-backend)
![npm downloads](https://img.shields.io/npm/dt/nur-create-backend)
![license](https://img.shields.io/badge/license-MIT-green)
![node version](https://img.shields.io/node/v/nur-create-backend)

## 🎯 Features

- ✅ **Zero configuration** - Get started instantly
- 🎨 **Beautiful CLI** - Colorful output with loading spinners
- 📁 **Clean folder structure** - Scalable and maintainable
- 🔒 **Built-in error handling** - Dev/prod modes
- 🔄 **Hot reload** - Auto-restart with nodemon
- 📝 **Mongoose models** - Pre-configured with timestamps
- 🛣️ **Versioned API routes** - `/api/v1` by default
- 🌐 **CORS & logging** - Morgan logging configured
- 💚 **Health check** - Built-in `/health` endpoint
- 🚨 **404 handler** - Proper error responses

## ✨ What It Generates

Running the command creates a new folder containing:

- `server.js` – Entry point (loads env, connects MongoDB, starts Express)
- `src/app.js` – Express app with JSON parsing, CORS, morgan logging, versioned API
- `src/config/` – DB connection (`db.js`), constants (`constants.js`)
- `src/helpers/` – Error handling pipeline, async wrapper, response helper
- `src/routes/` – Top-level `index.js` plus versioned API route folders
- `src/routes/api/` – `userRoutes.js`, `authRoutes.js`
- `src/controllers/` – Sample `userController.js`, `authController.js`
- `src/models/` – Sample `User.js`, `Post.js` Mongoose models
- `public/` & `tests/` placeholders
- `package.json` – With scripts + dependencies
- `.gitignore` – Node.js best practices
- `.env.example` – Environment variable template
- Project README (basic template)

## 🧩 Prerequisites

- Node.js 16+ (recommend 18+)
- npm (or another package manager)
- A running MongoDB instance (local or Atlas)

## 🚀 Quick Start

Using `npx` (recommended – always latest version):

```bash
npx nur-create-backend my-api
```

Or install globally:

```bash
npm install -g nur-create-backend
nur-create-backend my-api
```

Then:

```bash
cd my-api
npm install
cp .env.example .env   # Edit with your MongoDB URI
npm run dev
```

## 📸 CLI Output

```
🚀 Creating your backend app...

✓ Setting up folder structure...
✓ Writing configuration files...
✓ Creating helper functions...
✓ Setting up controllers and routes...
✓ Creating database models...
✓ Finalizing project setup...
✓ ✅ Project created successfully!

📦 Next steps:

  cd my-api
  npm install
  cp .env.example .env
  npm run dev

🎉 Happy coding!
```

## 🛠 CLI Usage

### Basic Usage

```bash
nur-create-backend <project-name>
```

### Options

```bash
nur-create-backend --help       # Show help
nur-create-backend --version    # Show version
nur-create-backend -v my-api    # Verbose output
```

### Examples

```bash
# Create a blog API
npx nur-create-backend blog-api

# Create with verbose output
npx nur-create-backend my-app --verbose
```

If the target folder already exists, the CLI will abort with a helpful message.

## 📂 Folder Structure (Generated)

```
my-api/
├── server.js
├── package.json
├── .gitignore
├── .env.example
├── README.md
├── public/
│   └── .gitkeep
├── src/
│   ├── app.js
│   ├── config/
│   │   ├── db.js
│   │   └── constants.js
│   ├── controllers/
│   │   ├── userController.js
│   │   └── authController.js
│   ├── helpers/
│   │   ├── asyncHandler.js
│   │   ├── customError.js
│   │   ├── developmentError.js
│   │   ├── productionError.js
│   │   ├── globalError.js
│   │   └── apiResponse.js
│   ├── models/
│   │   ├── User.js
│   │   └── Post.js
│   ├── routes/
│   │   ├── index.js
│   │   └── api/
│   │       ├── userRoutes.js
│   │       └── authRoutes.js
│   ├── middlewares/
│   ├── services/
│   └── utils/
└── tests/
```

## 🔑 Environment Variables

Create a `.env` file in the generated project root:

```env
MONGO_URI=mongodb://127.0.0.1:27017/my-api
NODE_ENV=development
API_VERSION=/api/v1
PORT=5000
```

- `MONGO_URI` (required for DB connection)
- `NODE_ENV` controls error output (`development` vs `production`)
- `API_VERSION` sets the API prefix (defaults to `/api/v1`)
- `PORT` optional (defaults to `5000`)

## ▶️ Running the App

Scripts (from generated `package.json`):

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

Use:

```bash
npm run dev   # auto-restarts on changes
npm start     # production-style run
```

## 🌐 Default Routes

After starting the server, test these endpoints:

### Health Check

```bash
curl http://localhost:5000/health

# Response:
{
  "status": "OK",
  "message": "Server is running"
}
```

### GET Users

```bash
curl http://localhost:5000/api/v1/users

# Response:
{
  "message": "Users fetched",
  "data": [{ "id": 1, "name": "Demo User" }],
  "statusCode": 200,
  "status": "success"
}
```

### POST Login

```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Response:
{
  "message": "Logged in",
  "data": { "token": "demo-token" },
  "statusCode": 200,
  "status": "success"
}
```

### 404 Handler

```bash
curl http://localhost:5000/api/v1/nonexistent

# Response:
{
  "statusCode": 404,
  "message": "Route not found",
  "status": "error"
}
```

## 🧱 Architecture & Helpers

| Component             | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `asyncHandler.js`     | Wraps async route handlers; forwards errors to global handler |
| `customError.js`      | Custom error class (operational vs generic)                   |
| `developmentError.js` | Detailed stack trace JSON output                              |
| `productionError.js`  | Sanitized error response                                      |
| `globalError.js`      | Chooses dev vs prod handler                                   |
| `apiResponse.js`      | `success(res, data, message)` standardized success shape      |
| `constants.js`        | Centralizes `PORT`, `MONGO_URI`, `API_VERSION` resolution     |
| `db.js`               | Mongoose connection with safety checks                        |

## 🗄 Models (Sample)

### User

```js
{
  name: String (required),
  email: String (required, unique),
  password: String (required)
}
```

### Post

```js
{
  title: String,
  content: String,
  author: ObjectId -> User
}
```

These are examples—replace or extend them with your domain models.

## ➕ Adding a New Route

1. Create a controller in `src/controllers/thingController.js`
2. Create a router file in `src/routes/api/thingRoutes.js`
3. Mount it in `src/routes/index.js`:

```js
const thingRouter = require("./api/thingRoutes");
router.use("/things", thingRouter);
```

4. Restart (or let nodemon reload)

## 🧪 Adding Tests (Suggestion)

A simple smoke test (if you later install `jest` or `vitest`):

```js
// tests/app.test.js
describe("Sample", () => {
  it("works", () => {
    expect(true).toBe(true);
  });
});
```

## 🔐 Security Considerations

- Add password hashing (e.g., `bcrypt`) in `User` model logic
- Implement validation (Joi/Zod) for request bodies
- Add authentication (JWT, session) middleware
- Sanitize inputs & enable rate limiting (`express-rate-limit`)

## 🚀 Roadmap

| Priority | Feature                                   | Status      |
| -------- | ----------------------------------------- | ----------- |
| High     | JWT authentication template               | 📋 Planned  |
| High     | TypeScript support (`--typescript`)       | 📋 Planned  |
| Medium   | Interactive mode (prompts)                | 📋 Planned  |
| Medium   | Docker scaffold (`--docker`)              | 📋 Planned  |
| Medium   | PostgreSQL/MySQL support                  | 📋 Planned  |
| Low      | Logging abstraction (Winston/Pino)        | 📋 Planned  |
| Low      | Testing setup (Jest/Vitest)               | 📋 Planned  |

## 🐞 Troubleshooting

| Issue                      | Cause                            | Fix                                |
| -------------------------- | -------------------------------- | ---------------------------------- |
| Mongo connection fails     | Wrong `MONGO_URI`                | Update `.env`                      |
| CLI says folder exists     | Target directory already present | Choose a new project name          |
| Missing colorful output    | Terminal doesn't support colors  | Use a modern terminal              |
| Undefined API prefix       | `API_VERSION` not set            | Accept default or define in `.env` |
| `npm install` errors       | Old Node.js version              | Upgrade to Node.js 16+             |

## ❓ FAQ

**Q: Can I use TypeScript?**  
A: TypeScript support is coming soon! For now, you can manually convert the files.

**Q: Does it support PostgreSQL?**  
A: Currently MongoDB only. Other databases are on the roadmap.

**Q: Is authentication included?**  
A: Basic auth structure is scaffolded, but you need to implement JWT/bcrypt logic.

**Q: Can I deploy this to production?**  
A: Yes! Just set `NODE_ENV=production` and configure your production MongoDB URI.

**Q: How do I update to the latest version?**  
A: Use `npx nur-create-backend@latest` or run `npm update -g nur-create-backend` if installed globally.

## 📦 Uninstall (Global CLI)

```bash
npm uninstall -g nur-create-backend
```

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feat/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT © 2025 Nur Islam

## 🙏 Acknowledgments

Built with ❤️ using:
- [Express](https://expressjs.com/) - Fast web framework
- [Mongoose](https://mongoosejs.com/) - MongoDB ODM
- [Commander](https://github.com/tj/commander.js/) - CLI framework
- [Chalk](https://github.com/chalk/chalk) - Terminal colors
- [Ora](https://github.com/sindresorhus/ora) - Terminal spinners

---

⭐ **If this project helps you, please give it a star on [GitHub](https://github.com/NurTheDev/create-backend-app-npm)!**