import { pool } from "../db/lib.js";
import "dotenv/config";

// /**
//  * @desc Creates a new expense entry linked to the authenticated employee.
//  * @route POST /api/expenses
//  * @access Private (Employee only)
//  */
export const createExpense = async (req, res) => {
    // 1. Get employee ID from the authenticated user (set by protectRouter)
    // NOTE: This assumes 'req.user.id' holds the employee_id for this route.
    const employee_id = req.user.id;

    // 2. Extract expense details from the request body
    const { 
        amount, 
        description, 
        category, 
        currency, 
        receipt_url, // Optional
        remarks      // Optional
    } = req.body;

    // 3. Validation
    if (!amount || !description || !category || !currency) {
        return res.status(400).json({ message: "Amount, description, category, and currency are required fields." });
    }

    // Basic type validation for amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Amount must be a positive number." });
    }

    // Default values for database insertion
    const defaultStatus = 'Pending';
    const amountFloat = parseFloat(amount);

    try {
        // 4. SQL Query to insert the new expense
        const query = `
            INSERT INTO expense (
                employee_id,
                amount,
                description,
                category,
                currency,
                receipt_url,
                remarks,
                status,
                submitted_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *;
        `;

        const values = [
            employee_id,
            amountFloat,
            description,
            category,
            currency,
            receipt_url || null, // Insert NULL if optional field is missing
            remarks || null,     // Insert NULL if optional field is missing
            defaultStatus
        ];

        const result = await pool.query(query, values);
        const newExpense = result.rows[0];

        console.log(`New expense created by employee ${employee_id}: ${newExpense.expense_id}`);
        
        // 5. Success response
        res.status(201).json({ 
            message: "Expense successfully submitted.",
            expense: newExpense
        });

    } catch (err) {
        console.error("Error inserting new expense:", err.message);
        // Specifically check for foreign key constraint violation if it occurs, 
        // though protectRouter should prevent this if the user is valid.
        res.status(500).json({ message: "Internal server error: Could not submit expense." });
    }
};
