# nur-create-backend

A zero‑configuration CLI to scaffold a structured Express + MongoDB backend with clean architecture helpers, routing, error handling, and sample models/controllers.

![npm version](https://img.shields.io/npm/v/nur-create-backend)
![npm downloads](https://img.shields.io/npm/dt/nur-create-backend)
![license](https://img.shields.io/badge/license-MIT-green)
![node version](https://img.shields.io/node/v/nur-create-backend)

## 🎯 Features

- ✅ Zero configuration setup
- 📁 Clean, scalable folder structure
- 🔒 Built-in error handling (dev/prod modes)
- 🔄 Hot reload with nodemon
- 📝 Mongoose models with timestamps
- 🛣️ Versioned API routes
- 🎨 CORS & Morgan logging configured
- 🧪 Test folder ready

## ✨ What It Generates

Running the command creates a new folder containing:

- `server.js` – Entry point (loads env, connects MongoDB, starts Express)
- `src/app.js` – Express app with JSON + URL-encoded parsing, CORS, morgan logging, versioned API mount
- `src/config/` – DB connection (`db.js`), constants (`constants.js`)
- `src/helpers/` – Error handling pipeline (dev/prod), async wrapper, response helper
- `src/routes/` – Top-level `index.js` plus versioned API route folders
- `src/routes/api/` – `userRoutes.js`, `authRoutes.js`
- `src/controllers/` – Sample `userController.js`, `authController.js`
- `src/models/` – Sample `User.js`, `Post.js` Mongoose models
- `public/` & `tests/` placeholders
- `package.json` – With scripts + dependencies
- `.gitignore`
- Project README (basic template)
- Placeholder `.gitkeep` for `public/`

## 🧩 Prerequisites

- Node.js 16+ (recommend 18+)
- npm (or another package manager)
- A running MongoDB instance (local or Atlas) if you want DB connectivity to succeed

## 🚀 Quick Start

Using `npx` (recommended – always latest version):

```bash
npx nur-create-backend server
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
cp .env.example .env   # (You will create the .env file manually; see below)
npm run dev
```

## 📸 What You Get

```
✅ Structured Express app
✅ MongoDB connection ready
✅ Sample User & Post models
✅ Authentication & User routes
✅ Global error handling
✅ Environment configuration
✅ Ready for production deployment
```

## 🛠 CLI Usage

```bash
nur-create-backend <project-name>
```

Example:

```bash
npx nur-create-backend blog-api
```

If the target folder already exists, the CLI aborts with a message.

> NOTE: Currently there are no flags (like `--typescript` or `--git`). Feel free to add them later.

## 📂 Folder Structure (Generated)

```
my-api/
  server.js
  package.json
  .gitignore
  README.md
  public/
    .gitkeep
  src/
    app.js
    config/
      db.js
      constants.js
    controllers/
      userController.js
      authController.js
    helpers/
      asyncHandler.js
      customError.js
      developmentError.js
      productionError.js
      globalError.js
      apiResponse.js
    models/
      User.js
      Post.js
    routes/
      index.js
      api/
        userRoutes.js
        authRoutes.js
  tests/
```

## 🔑 Environment Variables

Create a `.env` file in the generated project root:

```
MONGO_URI=mongodb://127.0.0.1:27017/my-api
NODE_ENV=development
API_VERSION=/api/v1
PORT=5000
```

- `MONGO_URI` (required for DB connection to succeed)
- `NODE_ENV` controls verbose error output (`development` vs anything else)
- `API_VERSION` sets the prefix used in `app.js` (defaults to `/api/v1`)
- `PORT` optional (defaults internally to `5000`)

## ▶️ Running the App

Scripts (from generated `package.json`):

```jsonc
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

**GET Users**

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

**POST Login**

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

## 🧱 Architecture & Helpers

| Component             | Purpose                                                       |
| --------------------- | ------------------------------------------------------------- |
| `asyncHandler.js`     | Wraps async route handlers; forwards errors to global handler |
| `customError.js`      | Custom error class (operational vs generic)                   |
| `developmentError.js` | Detailed stack trace JSON output                              |
| `productionError.js`  | Sanitized error response                                      |
| `globalError.js`      | Chooses dev vs prod handler                                   |
| `apiResponse.js`      | `success(res, data, message)` standardized success shape      |
| `constants.js`        | Centralizes `PORT` & `MONGO_URI` resolution                   |
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

- Add password hashing (e.g., `bcrypt`) in `User` model logic (not provided).
- Implement validation (Joi/Zod) for request bodies.
- Add authentication (JWT, session) middleware.
- Sanitize inputs & enable rate limiting (`express-rate-limit`).

## 🚀 Suggested Next Features

| Priority | Feature                                   | Notes                                |
| -------- | ----------------------------------------- | ------------------------------------ |
| High     | .env example generator                    | Provide `.env.example` automatically |
| High     | Add a help flag (`-h/--help`)             | Improve UX                           |
| Medium   | CLI flags (e.g., `--git`, `--typescript`) | Expand flexibility                   |
| Medium   | Dockerfile scaffold                       | Quick containerization               |
| Medium   | Auth template (JWT)                       | Starter tokens & middleware          |
| Low      | Logging abstraction (Winston/Pino)        | Production logging                   |

## 🐞 Troubleshooting

| Issue                  | Cause                            | Fix                                |
| ---------------------- | -------------------------------- | ---------------------------------- |
| Mongo connection fails | Wrong `MONGO_URI`                | Update `.env`                      |
| CLI says folder exists | Target directory already present | Choose a new project name          |
| No colored output      | Basic console logs only          | Integrate chalk / kleur            |
| Undefined API prefix   | `API_VERSION` not set            | Accept default or define in `.env` |

## ❓ FAQ

**Q: Can I use TypeScript?**
A: Not yet, but it's on the roadmap! For now, you can manually convert the files.

**Q: Does it support PostgreSQL?**
A: Currently MongoDB only. We may add other database options in future versions.

**Q: Is authentication included?**
A: Basic auth structure is scaffolded, but you need to implement JWT/bcrypt logic.

**Q: Can I deploy this to production?**
A: Yes! Just set `NODE_ENV=production` and configure your production MongoDB URI.

## 📦 Uninstall (Global CLI)

```bash
npm uninstall -g nur-create-backend
```

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`feat/add-help-flag`)
3. Commit changes
4. Open a Pull Request

## 📄 License

MIT © 2025 Nur Islam

---

If this project helps you bootstrap faster, a ⭐ on the repository is appreciated!
