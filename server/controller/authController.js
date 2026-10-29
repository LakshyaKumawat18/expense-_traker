import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/UserModels.js";
import { JWT_EXPIRES_IN, JWT_SECRET } from "../utils/constants.utils.js";

const passwordRounds = 12;

function createToken(userId) {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured before using authentication routes.");
  }

  return jwt.sign({}, JWT_SECRET, {
    subject: userId.toString(),
    expiresIn: JWT_EXPIRES_IN,
  });
}

function userResponse(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
}

export async function register(request, response) {
  const { name, email, password } = request.body ?? {};
  if (
    typeof name !== "string" ||
    !name.trim() ||
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    typeof password !== "string" ||
    password.length < 8
  ) {
    response.status(400).json({
      error: "Provide a name, a valid email, and a password of at least 8 characters.",
    });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    response.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: await bcrypt.hash(password, passwordRounds),
  });

  response.status(201).json({
    token: createToken(user._id),
    user: userResponse(user),
  });
}

export async function login(request, response) {
  const { email, password } = request.body ?? {};
  if (typeof email !== "string" || typeof password !== "string") {
    response.status(400).json({ error: "Email and password are required." });
    return;
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    response.status(401).json({ error: "Invalid email or password." });
    return;
  }

  response.status(200).json({
    token: createToken(user._id),
    user: userResponse(user),
  });
}