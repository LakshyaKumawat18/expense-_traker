import { useEffect, useMemo, useState } from 'react'
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useNavigate,
  useParams,
} from 'react-router-dom'
import './App.css'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '')
const TOKEN_KEY = 'expense-tracker-token'
const USER_KEY = 'expense-tracker-user'
const categories = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education', 'Travel', 'Other']
const paymentMethods = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer', 'Other']
const money = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
})

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  } catch {
    return null
  }
}

function localDateString(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

function formatDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

async function apiRequest(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (response.status === 204) return null

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(data.error || 'Something went wrong. Please try again.')
    error.status = response.status
    throw error
  }
  return data
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(getStoredUser)

  function signIn(result) {
    localStorage.setItem(TOKEN_KEY, result.token)
    localStorage.setItem(USER_KEY, JSON.stringify(result.user))
    setToken(result.token)
    setUser(result.user)
  }

  function signOut() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setToken(null)
    setUser(null)
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={token ? <Navigate to="/dashboard" replace /> : <AuthPage mode="login" onAuthenticated={signIn} />}
        />
        <Route
          path="/register"
          element={token ? <Navigate to="/dashboard" replace /> : <AuthPage mode="register" onAuthenticated={signIn} />}
        />
        <Route element={token ? <AppLayout user={user} onSignOut={signOut} /> : <Navigate to="/login" replace />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard token={token} user={user} />} />
          <Route path="/expenses" element={<ExpensesPage token={token} />} />
          <Route path="/expenses/add" element={<ExpenseForm token={token} />} />
          <Route path="/expenses/:id/edit" element={<ExpenseForm token={token} />} />
        </Route>
        <Route path="*" element={<Navigate to={token ? '/dashboard' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

function AuthPage({ mode, onAuthenticated }) {
  const navigate = useNavigate()
  const isRegister = mode === 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await apiRequest(`/auth/${mode}`, {
        method: 'POST',
        body: JSON.stringify(form),
      })
      onAuthenticated(result)
      navigate('/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link className="brand auth-brand" to="/login">
          <span className="brand-mark">₹</span><span>Expense Tracker</span>
        </Link>
        <span className="eyebrow">PERSONAL FINANCE</span>
        <h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="auth-subtitle">
          {isRegister ? 'Sign up to start tracking your expenses.' : 'Log in to manage your expenses.'}
        </p>
        <form className="form-stack" onSubmit={submit}>
          {isRegister && (
            <label>
              Name
              <input
                autoComplete="name"
                maxLength={80}
                placeholder="Your name"
                required
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />
            </label>
          )}
          <label>
            Email
            <input
              autoComplete="email"
              type="email"
              placeholder="you@example.com"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              type="password"
              minLength={8}
              placeholder="At least 8 characters"
              required
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary full-button" disabled={busy} type="submit">
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>
        <p className="auth-switch">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Register'}</Link>
        </p>
      </section>
    </main>
  )
}

function AppLayout({ user, onSignOut }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/dashboard">
          <span className="brand-mark">₹</span><span>Expense Tracker</span>
        </Link>
        <span className="sidebar-label">MENU</span>
        <nav className="side-nav">
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">⌂</span> Dashboard
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">▤</span> Expenses
          </NavLink>
          <NavLink to="/expenses/add" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span className="nav-icon">＋</span> Add Expense
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-user">
            <span className="avatar">{user?.name?.slice(0, 1).toUpperCase() || 'U'}</span>
            <div className="user-copy">
              <strong>{user?.name || 'User'}</strong>
              <span>{user?.email || ''}</span>
            </div>
          </div>
          <button className="nav-item signout-button" onClick={onSignOut} type="button">
            <span className="nav-icon">↪</span> Logout
          </button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <span>Personal Expense Tracker</span>
          <span className="topbar-user">{user?.name || user?.email}</span>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  )
}

function useExpenseList(token) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    apiRequest('/expenses', { token })
      .then((data) => {
        if (active) setExpenses(data)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [token])

  return { expenses, loading, error, setExpenses }
}

function PageTitle({ eyebrow, title, action }) {
  return (
    <div className="page-title-row">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  )
}

function Dashboard({ token, user }) {
  const { expenses, loading, error } = useExpenseList(token)
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
  const recent = expenses.slice(0, 5)

  return (
    <>
      <PageTitle
        eyebrow="OVERVIEW"
        title={`Dashboard${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`}
        action={<Link className="button button-primary" to="/expenses/add">＋ Add Expense</Link>}
      />
      {error && <ErrorBanner message={error} />}
      <section className="stats-grid">
        <StatCard label="Total Expenses" value={money.format(total)} icon="₹" />
        <StatCard label="Total Records" value={loading ? '…' : expenses.length} icon="#" />
      </section>
      <section className="panel recent-panel">
        <div className="panel-heading">
          <div><h2>Recent Expenses</h2><p>Your latest recorded transactions</p></div>
          <Link className="subtle-link" to="/expenses">View all expenses →</Link>
        </div>
        {loading ? <Loading /> : recent.length ? <ExpenseTable expenses={recent} compact /> : <EmptyState />}
      </section>
    </>
  )
}

function StatCard({ label, value, icon }) {
  return (
    <article className="stat-card">
      <span className="stat-icon">{icon}</span>
      <div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong></div>
    </article>
  )
}

function ExpensesPage({ token }) {
  const { expenses, loading, error, setExpenses } = useExpenseList(token)
  const [query, setQuery] = useState('')
  const navigate = useNavigate()
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return expenses.filter((expense) =>
      [expense.title, expense.description, expense.category, expense.paymentMethod]
        .some((value) => String(value || '').toLowerCase().includes(normalized)),
    )
  }, [expenses, query])

  async function deleteExpense(id) {
    if (!window.confirm('Delete this expense? This action cannot be undone.')) return
    try {
      await apiRequest(`/expenses/${id}`, { token, method: 'DELETE' })
      setExpenses((current) => current.filter((expense) => expense._id !== id))
    } catch (deleteError) {
      window.alert(deleteError.message)
    }
  }

  return (
    <>
      <PageTitle
        eyebrow="TRANSACTIONS"
        title="All Expenses"
        action={<Link className="button button-primary" to="/expenses/add">＋ Add Expense</Link>}
      />
      <section className="panel list-panel">
        {error && <ErrorBanner message={error} />}
        <div className="list-toolbar">
          <div><h2>Expense records</h2><p>{expenses.length} total {expenses.length === 1 ? 'record' : 'records'}</p></div>
          <input
            className="search-input"
            type="search"
            aria-label="Search expenses"
            placeholder="Search expenses..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {loading ? <Loading /> : filtered.length ? (
          <ExpenseTable
            expenses={filtered}
            onEdit={(id) => navigate(`/expenses/${id}/edit`)}
            onDelete={deleteExpense}
          />
        ) : <EmptyState message={expenses.length ? 'No matching expenses.' : undefined} />}
      </section>
    </>
  )
}

function ExpenseTable({ expenses, compact = false, onEdit, onDelete }) {
  return (
    <div className="table-scroll">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Title</th><th>Category</th><th>Amount</th><th>Date</th>
            {!compact && <><th>Payment method</th><th>Actions</th></>}
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense._id}>
              <td>
                <strong>{expense.title || expense.description || 'Expense'}</strong>
                {expense.description && expense.title && <span className="table-description">{expense.description}</span>}
              </td>
              <td><span className="category-chip">{expense.category}</span></td>
              <td className="amount-cell">{money.format(expense.amount)}</td>
              <td>{formatDate(expense.date)}</td>
              {!compact && (
                <>
                  <td>{expense.paymentMethod || '—'}</td>
                  <td>
                    <div className="table-actions">
                      <button type="button" onClick={() => onEdit(expense._id)}>Edit</button>
                      <button className="delete-action" type="button" onClick={() => onDelete(expense._id)}>Delete</button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ExpenseForm({ token }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [form, setForm] = useState({
    title: '',
    amount: '',
    category: '',
    paymentMethod: '',
    date: localDateString(),
    description: '',
  })
  const [loading, setLoading] = useState(editing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!editing) return undefined
    let active = true
    apiRequest(`/expenses/${id}`, { token })
      .then((expense) => {
        if (!active) return
        setForm({
          title: expense.title || expense.description || '',
          amount: String(expense.amount),
          category: expense.category || '',
          paymentMethod: expense.paymentMethod || '',
          date: String(expense.date).slice(0, 10),
          description: expense.description || '',
        })
      })
      .catch((requestError) => { if (active) setError(requestError.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [editing, id, token])

  async function submit(event) {
    event.preventDefault()
    setError('')
    setSaving(true)
    try {
      const expense = { ...form, amount: Number(form.amount) }
      await apiRequest(editing ? `/expenses/${id}` : '/expenses', {
        token,
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(expense),
      })
      navigate('/expenses', { replace: true })
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Loading />

  return (
    <>
      <PageTitle eyebrow="EXPENSES" title={editing ? 'Edit Expense' : 'Add Expense'} />
      <section className="panel form-panel">
        {error && <ErrorBanner message={error} />}
        <form className="expense-form" onSubmit={submit}>
          <label>
            Title <input maxLength={120} required placeholder="e.g. Grocery shopping" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>
            Amount <div className="amount-input"><span>₹</span><input type="number" min="0.01" step="0.01" required placeholder="0.00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></div>
          </label>
          <label>
            Category
            <select required value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <option value="" disabled>Select category</option>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>
          <label>
            Payment method
            <select required value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })}>
              <option value="" disabled>Select payment method</option>
              {paymentMethods.map((method) => <option key={method}>{method}</option>)}
            </select>
          </label>
          <label>
            Date <input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
          </label>
          <label className="wide-field">
            Description <textarea maxLength={200} placeholder="Add a note (optional)" rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className="form-actions wide-field">
            <Link className="button button-secondary" to="/expenses">Cancel</Link>
            <button className="button button-primary" disabled={saving} type="submit">
              {saving ? 'Saving…' : editing ? 'Update Expense' : 'Save Expense'}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

function ErrorBanner({ message }) {
  return <div className="error-banner" role="alert">{message}</div>
}

function Loading() {
  return <div className="loading-state"><span className="loader" /> Loading expenses…</div>
}

function EmptyState({ message = 'No expenses recorded yet. Add your first expense to get started.' }) {
  return <div className="empty-state"><span className="empty-icon">₹</span><p>{message}</p></div>
}

export default App
