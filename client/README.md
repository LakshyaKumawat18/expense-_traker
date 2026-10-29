# Personal Expense Tracker

React expense tracker with registration, login, a dashboard, expense listing, and add/edit pages. The API stores each user's expenses in MongoDB and protects them with JWT authentication.

## Run locally

1. Start MongoDB.
2. In `server`, run `npm install` once and then `npm run dev`.
3. In `client`, run `npm install` once and then `npm run dev`.
4. Open the Vite URL printed in the client terminal.

The client uses `http://localhost:5000/api` by default. Set `VITE_API_URL` in `client/.env` to point to a different API:

```env
VITE_API_URL=http://localhost:5000/api
```

Set `MONGODB_URI`, `PORT`, and `JWT_SECRET` in the server environment as needed. Always provide a unique, strong `JWT_SECRET` when deploying.

## Pages

- `/register` — create an account
- `/login` — sign in
- `/dashboard` — total spending, record count, and recent expenses
- `/expenses` — search, list, edit, and delete expenses
- `/expenses/add` — add an expense
- `/expenses/:id/edit` — edit an expense

Expenses include a title, amount, category, payment method, date, and optional description.
