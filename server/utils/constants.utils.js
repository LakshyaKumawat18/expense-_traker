export const PORT = Number(process.env.PORT || 5000);
export const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/expense_tracker";
const isProduction = process.env.NODE_ENV === "production";
export const JWT_SECRET =
  process.env.JWT_SECRET ||
  (isProduction ? undefined : "expense-tracker-local-development-secret-change-before-deploy");
export const JWT_EXPIRES_IN = "7d";