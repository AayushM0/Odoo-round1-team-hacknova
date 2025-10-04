import { pool } from "../db/lib.js";

/**
 * Creates a new expense, retrieves the associated approval workflow, 
 * creates PENDING entries in the managerapproval table, and updates 
 * the expense status from 'Draft' to 'Pending'. This entire process is
 * wrapped in a database transaction.
 *
 * @param {object} req - The request object (must have req.user.id populated).
 * @param {object} res - The response object.
 */
export const createExp = async (req, res) => {
    // Destructure properties from the request body
    const {
        description,
        category = null,
        amount,
        currency,
        receipt_url = null,
        remarks = null,
    } = req.body;

    // Assuming employee ID is correctly placed in req.user.id by middleware
    const employeeId = req.user.id; 
    
    let client;
    let expenseId;

    // --- Basic Validation ---
    if (!description || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields: description, amount, or currency.' });
    }
    if (isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Amount must be a valid number.' });
    }

    try {
        client = await pool.connect();
        await client.query('BEGIN'); // START TRANSACTION

        // 1. INSERT THE EXPENSE (Status is 'Pending' immediately, as expected in the prompt)
        const insertExpenseQuery = `
            INSERT INTO expense (employee_id, description, category, amount, currency, receipt_url, remarks, status, submitted_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending', NOW())
            RETURNING expense_id, employee_id, description, category, amount, currency, status, submitted_at
        `;

        const expenseResult = await client.query(insertExpenseQuery, [
            employeeId,
            description,
            category,
            amount,
            currency,
            receipt_url,
            remarks,
        ]);
        
        const newExpense = expenseResult.rows[0];
        expenseId = newExpense.expense_id;


        // 2. FETCH THE APPROVAL WORKFLOW STEPS
        // This query retrieves the actual manager IDs (steps) from the approvalworkflow table.
        const workflowQuery = `
            SELECT steps FROM approvalworkflow
            WHERE employee_id = $1;
        `;
        const workflowResult = await client.query(workflowQuery, [employeeId]);
        
        let workflowSteps = [];
        
        if (workflowResult.rows.length > 0) {
            // Retrieve the steps array.
            workflowSteps = workflowResult.rows[0].steps || [];

            // Deserialize the array if it was stored as a JSON string (TEXT/VARCHAR)
            if (typeof workflowSteps === 'string') {
                workflowSteps = JSON.parse(workflowSteps);
            }
            if (!Array.isArray(workflowSteps) || workflowSteps.length === 0) {
                console.warn(`Workflow found for employee ${employeeId} but steps array is empty.`);
                // If workflow exists but is empty, treat as unconfigured.
            }

        } else {
            // Handle case where no workflow is defined for this employee
            console.warn(`No approval workflow found for employee ${employeeId}. Expense status will be reverted to Draft.`);
            
            // 2b. If no workflow found, revert status to 'Draft'
            const revertStatusQuery = `
                UPDATE expense
                SET status = 'Draft'
                WHERE expense_id = $1;
            `;
            await client.query(revertStatusQuery, [expenseId]);

            await client.query('COMMIT'); 
            return res.status(201).json({ 
                message: 'Expense created successfully, but no approval workflow was found. Status remains Draft.', 
                expense: { ...newExpense, status: 'Draft' }
            });
        }


        // 3. INSERT ROWS INTO managerapproval FOR EACH STEP
        // This loop uses the manager IDs retrieved from workflowSteps.
        const insertApprovalsPromises = [];
        const managerApprovalQuery = `
            INSERT INTO managerapproval (expense_id, step_order, manager_id, action)
            VALUES ($1, $2, $3, 'Pending');
        `;

        workflowSteps.forEach((manager_id, index) => {
            // manager_id comes directly from the array fetched from the database.
            insertApprovalsPromises.push(
                client.query(managerApprovalQuery, [
                    expenseId, 
                    index + 1, 
                    manager_id
                ])
            );
        });

        await Promise.all(insertApprovalsPromises);


        // 4. Update is already done in step 1, but we keep the structure 
        // to show successful transaction completion logic.
        
        await client.query('COMMIT'); // END TRANSACTION (SUCCESS)

        // Success response
        res.status(201).json({ 
            message: 'Expense created and submitted for approval successfully.', 
            expense: { 
                ...newExpense, 
                status: 'Pending' 
            },
            approval_steps_created: workflowSteps.length
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK'); // ROLLBACK TRANSACTION on error
        }
        console.error('Error in createExp transaction:', error);
        
        // Handle specific DB errors (e.g., Foreign Key violation if a managerId in the steps array is invalid)
        if (error.code === '23503') {
             return res.status(400).json({ error: 'Invalid employee ID or category/currency, or invalid manager ID found in the approval workflow steps.' });
        }
        
        res.status(500).json({ error: 'Failed to submit expense due to a server error. Transaction rolled back.', detail: error.message });
        
    } finally {
        if (client) {
            client.release(); // Release the database client back to the pool
        }
    }
}
