import express from "express";
import mongoose from "mongoose";
import {
  createExpense,
  deleteExpense,
  getExpense,
  listExpenses,
  updateExpense,
} from "./controller/ExpenseController.js";
import { login, register } from "./controller/authController.js";
import { authenticateToken } from "./middleware/AuthMiddleware.js";
import { JWT_SECRET, MONGODB_URI, PORT } from "./utils/constants.utils.js";

const app = express();

app.use((request, response, next) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (request.method === "OPTIONS") {
    response.status(204).end();
    return;
  }
  next();
});
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (request, response) => {
  response.status(200).json({ status: "ok" });
});
app.post("/api/auth/register", register);
app.post("/api/auth/login", login);
app.get("/api/expenses", authenticateToken, listExpenses);
app.post("/api/expenses", authenticateToken, createExpense);
app.get("/api/expenses/:id", authenticateToken, getExpense);
app.put("/api/expenses/:id", authenticateToken, updateExpense);
app.patch("/api/expenses/:id", authenticateToken, updateExpense);
app.delete("/api/expenses/:id", authenticateToken, deleteExpense);

app.use((request, response) => {
  response.status(404).json({ error: "Route not found." });
});

app.use((error, request, response, next) => {
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error.name === "ValidationError" || error.name === "CastError" || error.type === "entity.parse.failed") {
    response.status(400).json({ error: error.message });
    return;
  }
  if (error.type === "entity.too.large") {
    response.status(413).json({ error: "Request body must be 1 MB or smaller." });
    return;
  }
  if (error.code === 11000) {
    response.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  console.error("Request failed:", error);
  response.status(500).json({ error: "Internal server error." });
});

async function startServer() {
  if (!JWT_SECRET) {
    throw new Error("Set JWT_SECRET in the environment before starting the server in production.");
  }
  if (!process.env.JWT_SECRET) {
    console.warn(
      "JWT_SECRET is not set; using a development-only secret. Set JWT_SECRET before deploying."
    );
  }

  await mongoose.connect(MONGODB_URI);
  app.listen(PORT, () => {
    console.log(`Expense tracker API listening on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Could not start the expense tracker API:", error.message);
  process.exitCode = 1;
});