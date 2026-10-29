import Expense from "../models/ExpenseModel.js";

const editableFields = ["title", "amount", "category", "paymentMethod", "date", "description"];

function validateExpenseInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Expense details must be a JSON object.";
  }

  const requiredFields = ["title", "amount", "category", "paymentMethod", "date"];
  const fields = editableFields.filter((field) => Object.hasOwn(body, field));
  if (
    fields.length === 0 ||
    (!partial && requiredFields.some((field) => !Object.hasOwn(body, field)))
  ) {
    return partial
      ? "Provide at least one expense field to update."
      : "Title, amount, category, payment method, and date are required.";
  }

  if (
    Object.hasOwn(body, "title") &&
    (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 120)
  ) {
    return "Title must be a non-empty string of at most 120 characters.";
  }
  if (
    Object.hasOwn(body, "description") &&
    (typeof body.description !== "string" || body.description.trim().length > 200)
  ) {
    return "Description must be 200 characters or fewer.";
  }
  if (
    Object.hasOwn(body, "amount") &&
    (typeof body.amount !== "number" || !Number.isFinite(body.amount) || body.amount <= 0)
  ) {
    return "Amount must be a positive number.";
  }
  if (
    Object.hasOwn(body, "category") &&
    (typeof body.category !== "string" || !body.category.trim() || body.category.trim().length > 50)
  ) {
    return "Category must be a non-empty string of at most 50 characters.";
  }
  if (
    Object.hasOwn(body, "paymentMethod") &&
    (typeof body.paymentMethod !== "string" ||
      !body.paymentMethod.trim() ||
      body.paymentMethod.trim().length > 40)
  ) {
    return "Payment method must be a non-empty string of at most 40 characters.";
  }
  if (
    Object.hasOwn(body, "date") &&
    (typeof body.date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(body.date) ||
      !Number.isFinite(Date.parse(`${body.date}T00:00:00.000Z`)) ||
    new Date(`${body.date}T00:00:00.000Z`).toISOString().slice(0, 10) !== body.date
    )
  ) {
    return "Date must be a valid date in YYYY-MM-DD format.";
  }

  return null;
}

function editableExpenseFields(body) {
  return Object.fromEntries(
    editableFields
      .filter((field) => Object.hasOwn(body, field))
      .map((field) => [
        field,
        ["title", "description", "category", "paymentMethod"].includes(field)
          ? body[field].trim()
          : body[field],
      ])
  );
}

export async function listExpenses(request, response) {
  const expenses = await Expense.find({ user: request.user.id }).sort({ date: -1, createdAt: -1 });
  response.status(200).json(expenses);
}

export async function createExpense(request, response) {
  const validationError = validateExpenseInput(request.body);
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }

  const expense = await Expense.create({
    ...editableExpenseFields(request.body),
    user: request.user.id,
  });
  response.status(201).json(expense);
}

export async function getExpense(request, response) {
  const expense = await Expense.findOne({ _id: request.params.id, user: request.user.id });
  if (!expense) {
    response.status(404).json({ error: "Expense not found." });
    return;
  }

  response.status(200).json(expense);
}

export async function updateExpense(request, response) {
  const validationError = validateExpenseInput(request.body, { partial: true });
  if (validationError) {
    response.status(400).json({ error: validationError });
    return;
  }

  const expense = await Expense.findOneAndUpdate(
    { _id: request.params.id, user: request.user.id },
    { $set: editableExpenseFields(request.body) },
    { new: true, runValidators: true }
  );
  if (!expense) {
    response.status(404).json({ error: "Expense not found." });
    return;
  }

  response.status(200).json(expense);
}

export async function deleteExpense(request, response) {
  const expense = await Expense.findOneAndDelete({
    _id: request.params.id,
    user: request.user.id,
  });
  if (!expense) {
    response.status(404).json({ error: "Expense not found." });
    return;
  }

  response.status(204).end();
}