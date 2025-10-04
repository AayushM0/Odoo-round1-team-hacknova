
import {pool} from '../db/lib.js'; // pg Pool instance

const ALLOWED_UPDATE_FIELDS = new Set(['description', 'category', 'amount', 'currency', 'paid_by']);

// ----- Validation helpers -----
function validateCreateExpense(body) {
  const errors = [];
  if (!body.description || typeof body.description !== 'string') errors.push('description is required and must be a string.');
  if (body.category && typeof body.category !== 'string') errors.push('category must be a string.');
  if (body.amount === undefined || typeof body.amount !== 'number' || body.amount <= 0) errors.push('amount is required and must be a positive number.');
  if (!body.currency || typeof body.currency !== 'string' || body.currency.length !== 3) errors.push('currency is required and must be a 3-letter string.');
  if (body.paid_by && typeof body.paid_by !== 'string') errors.push('paid_by must be a string.');
  return errors;
}

function validateUpdateExpense(body) {
  const errors = [];
  // Only allow updating the whitelisted fields or a valid status transition request
  const validStatuses = ['Draft', 'Submitted', 'Waiting Approval', 'Approved', 'Rejected'];
  if (body.description && typeof body.description !== 'string') errors.push('description must be a string.');
  if (body.category && typeof body.category !== 'string') errors.push('category must be a string.');
  if (body.amount !== undefined && (typeof body.amount !== 'number' || body.amount <= 0)) errors.push('amount must be a positive number.');
  if (body.currency && (typeof body.currency !== 'string' || body.currency.length !== 3)) errors.push('currency must be a 3-letter string.');
  if (body.paid_by && typeof body.paid_by !== 'string') errors.push('paid_by must be a string.');
  if (body.status && !validStatuses.includes(body.status)) errors.push(`status must be one of ${validStatuses.join(', ')}.`);
  // Ensure no extra keys are present that are not allowed
  const unknownKeys = Object.keys(body).filter(k => k !== 'status' && !ALLOWED_UPDATE_FIELDS.has(k));
  if (unknownKeys.length) errors.push(`Unknown/unsupported fields in update: ${unknownKeys.join(', ')}`);
  return errors;
}

// ----- GET all expenses -----
export const getExpenses = (async (req, res) => {
  const userId = req.user.id;
  const { status, category, search } = req.query;
  const page = parseInt(req.query.page ?? '1', 10);
  const perPage = Math.min(parseInt(req.query.perPage ?? '10', 10), 100);

  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(perPage) || perPage < 1) {
    return res.status(400).json({ message: 'Invalid pagination parameters.' });
  }

  // Build paramized WHERE clause
  const params = [userId];
  let where = 'WHERE user_id = $1';

  if (status) {
    params.push(status);
    where += ` AND status = $${params.length}`;
  }

  if (category) {
    params.push(category);
    where += ` AND category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    where += ` AND description ILIKE $${params.length}`;
  }

  const offset = (page - 1) * perPage;
  params.push(perPage, offset);

  const expensesQuery = `
    SELECT id, user_id, company_id, description, category, amount, currency, paid_by, status, log, date, last_updated
    FROM expenses
    ${where}
    ORDER BY date DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countQuery = `SELECT COUNT(*) FROM expenses ${where}`;

  const [expensesRes, countRes] = await Promise.all([
    pool.query(expensesQuery, params),
    pool.query(countQuery, params.slice(0, params.length - 2))
  ]);

  const total = parseInt(countRes.rows[0].count, 10);

  res.status(200).json({
    data: expensesRes.rows,
    meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) }
  });
});

// ----- CREATE expense -----
export const createExpense = (async (req, res) => {
  const errors = validateCreateExpense(req.body);
  if (errors.length) return res.status(400).json({ message: 'Validation failed.', errors });

  const { description, category = null, amount, currency, paid_by = null } = req.body;
  const userId = req.user.id;
  const companyId = req.user.company_id;

  const logEntry = [{ message: `Expense submitted by ${req.user.name}`, timestamp: new Date().toISOString() }];

  const insertQuery = `
    INSERT INTO expenses (user_id, company_id, description, category, amount, currency, paid_by, status, log, date, last_updated)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'Submitted', $8::jsonb, NOW(), NOW())
    RETURNING id, user_id, company_id, description, category, amount, currency, paid_by, status, log, date, last_updated
  `;

  const result = await pool.query(insertQuery, [userId, companyId, description, category, amount, currency, paid_by, JSON.stringify(logEntry)]);
  res.status(201).json({ message: 'Expense created successfully.', data: result.rows[0] });
});

// ----- UPDATE expense -----
// NOTE: To make this fully atomic with SELECT ... FOR UPDATE you'd need a client + transaction.
// The version below avoids SQL injection by whitelisting fields and uses a single UPDATE statement.
export const updateExpense = (async (req, res) => {
  const expenseId = parseInt(req.params.expenseId, 10);
  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return res.status(400).json({ message: 'Invalid expenseId' });
  }

  const userId = req.user.id;

  // Fetch the expense record and ensure ownership
  const existing = await pool.query('SELECT id, user_id, status, log FROM expenses WHERE id = $1 AND user_id = $2', [expenseId, userId]);
  if (!existing.rows.length) return res.status(404).json({ message: 'Expense not found or unauthorized.' });

  const expense = existing.rows[0];
  if (['Approved', 'Waiting Approval'].includes(expense.status)) {
    return res.status(403).json({ message: 'Cannot modify a submitted or approved expense.' });
  }

  const errors = validateUpdateExpense(req.body);
  if (errors.length) return res.status(400).json({ message: 'Validation failed.', errors });

  // Build update set from whitelisted fields only
  const updateFields = [];
  const values = [];
  let paramIndex = 1; // we'll push expenseId and userId later at front

  for (const key of Object.keys(req.body)) {
    if (key === 'status') continue; // handle status separately
    if (!ALLOWED_UPDATE_FIELDS.has(key)) continue; // skip unknown fields
    updateFields.push(`${key} = $${++paramIndex}`); // increment param index first to match position
    values.push(req.body[key]);
  }

  // Status workflow: if user tries to submit a rejected expense, change to Waiting Approval
  let newStatus = req.body.status;
  const logs = Array.isArray(expense.log) ? expense.log : [];

  if (newStatus === 'Submitted' && expense.status === 'Rejected') {
    newStatus = 'Waiting Approval';
    logs.push({ message: `Expense resubmitted by ${req.user.name}`, timestamp: new Date().toISOString() });
  } else if (newStatus) {
    // if status was provided and is valid, add a log entry
    logs.push({ message: `Status changed to ${newStatus} by ${req.user.name}`, timestamp: new Date().toISOString() });
  }

  if (newStatus) {
    updateFields.push(`status = $${++paramIndex}`);
    values.push(newStatus);
  }

  if (logs.length) {
    // append log safely using JSONB concat
    updateFields.push(`log = COALESCE(log, '[]'::jsonb) || $${++paramIndex}::jsonb`);
    values.push(JSON.stringify(logs.slice(-5))); // keep last N entries if desired; here we append all but you can optimize
  }

  // Always update last_updated
  updateFields.push(`last_updated = NOW()`);

  if (updateFields.length === 0) {
    return res.status(400).json({ message: 'No valid fields provided for update.' });
  }

  // Prepend expenseId and userId as $1 and $2 for WHERE clause
  const finalValues = [expenseId, userId, ...values];

  const updateQuery = `
    UPDATE expenses
    SET ${updateFields.join(', ')}
    WHERE id = $1 AND user_id = $2
    RETURNING id, user_id, company_id, description, category, amount, currency, paid_by, status, log, date, last_updated
  `;

  const updateRes = await pool.query(updateQuery, finalValues);
  if (!updateRes.rows.length) return res.status(404).json({ message: 'Expense not found or unauthorized.' });

  res.status(200).json({ message: 'Expense updated successfully.', data: updateRes.rows[0] });
});

// ----- GET single expense by ID -----
export const getExpenseById = (async (req, res) => {
  const expenseId = parseInt(req.params.expenseId, 10);
  if (!Number.isInteger(expenseId) || expenseId <= 0) {
    return res.status(400).json({ message: 'Invalid expenseId' });
  }
  const userId = req.user.id;

  const result = await pool.query(
    `SELECT id, user_id, company_id, description, category, amount, currency, paid_by, status, log, date, last_updated
     FROM expenses WHERE id = $1 AND user_id = $2`,
    [expenseId, userId]
  );

  if (!result.rows.length) return res.status(404).json({ message: 'Expense not found or unauthorized.' });
  res.status(200).json({ data: result.rows[0] });
});