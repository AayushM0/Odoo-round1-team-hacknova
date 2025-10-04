import { pool } from "../db/lib.js";

/**
 * Retrieves all pending expense approval tasks assigned to the authenticated manager.
 * This query enforces sequential approval by only showing the CURRENT minimum pending 
 * step for a given expense.
 *
 * @param {object} req - The request object (must have req.user.id populated).
 * @param {object} res - The response object.
 */
export const getPendingApprovals = async (req, res) => {
    // managerId comes from the authenticated user's ID
    const managerId = req.user.id;
    let client;

    try {
        client = await pool.connect();

        // RE-ENFORCING SEQUENTIAL VIEW:
        // Query only returns tasks that are the minimum step_order still set to 'Pending'
        const pendingApprovalsQuery = `
            SELECT
                ma.approval_id,
                e.expense_id,
                e.description,
                e.amount,
                e.currency,
                e.employee_id,
                e.submitted_at,
                ma.step_order,
                emp.name AS employee_name
            FROM managerapproval ma
            JOIN expense e 
                ON ma.expense_id = e.expense_id
            JOIN employee emp 
                ON e.employee_id = emp.employee_id
            WHERE 
                ma.manager_id = $1            -- 1. Must be assigned to the current manager
                AND ma.action = 'Pending'     -- 2. Must not be processed yet
                AND e.status = 'Pending'      -- 3. The overall expense must be in active approval
                AND ma.step_order = (         -- 4. CRITICAL: The step must be the currently active step (minimum pending order)
                    SELECT MIN(step_order)
                    FROM managerapproval
                    WHERE expense_id = ma.expense_id 
                    AND action = 'Pending'
                )
            ORDER BY e.submitted_at ASC, ma.step_order ASC;
        `;
        
        const result = await client.query(pendingApprovalsQuery, [managerId]);

        res.status(200).json(result.rows);

    } catch (error) {
        console.error('Error fetching pending approvals:', error);
        res.status(500).json({ error: 'Failed to fetch pending approval list.' });
    } finally {
        if (client) {
            client.release();
        }
    }
};

/**
 * Updates a specific step in the managerapproval table (Approve/Reject).
 * This controller ENFORCES sequential approval: a step can only be approved/rejected 
 * if it is the currently active, minimum pending step for that expense.
 *
 * @param {object} req - The request object (must have req.user.id populated and approval_id in body/params).
 * @param {object} res - The response object.
 */
export const updateManagerApproval = async (req, res) => {
    // Assuming the client obtained approval_id from the list provided by getPendingApprovals
    const { approval_id, action, remarks = null } = req.body; 
    
    const managerId = req.user.id; 
    let client;
    const validActions = ['Approved', 'Rejected'];

    // --- 1. Basic Validation ---
    if (!approval_id || !action) {
        return res.status(400).json({ error: 'Missing required fields: approval_id and action.' });
    }
    if (!validActions.includes(action)) {
        return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}.` });
    }
    
    try {
        client = await pool.connect();
        await client.query('BEGIN'); // START TRANSACTION

        // --- 2a. Check Sequential Order & Manager ID ---
        // Find the current minimum pending step for the expense associated with this approval_id.
        const currentStepCheckQuery = `
            SELECT 
                ma.expense_id,
                ma.step_order,
                (SELECT MIN(step_order) FROM managerapproval WHERE expense_id = ma.expense_id AND action = 'Pending') AS current_min_step
            FROM managerapproval ma
            WHERE ma.approval_id = $1 AND ma.manager_id = $2 AND ma.action = 'Pending';
        `;
        const stepCheckResult = await client.query(currentStepCheckQuery, [approval_id, managerId]);

        if (stepCheckResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Approval step not found, not assigned to you, or already processed.' });
        }
        
        const { expense_id, step_order, current_min_step } = stepCheckResult.rows[0];

        // CRITICAL: Reintroducing the Sequential Check
        if (step_order > current_min_step) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: `Cannot process step ${step_order}. Step ${current_min_step} must be processed first.` });
        }
        
        // --- 2b. Update the Approval Step (Since sequential check passed) ---
        const updateApprovalQuery = `
            UPDATE managerapproval
            SET action = $1, action_date = NOW(), remarks = $2
            WHERE approval_id = $3
            RETURNING expense_id;
        `;
        await client.query(updateApprovalQuery, [
            action, 
            remarks, 
            approval_id
        ]);
        
        let newExpenseStatus = 'Pending'; 

        // --- 3. Determine Next Expense Status ---
        if (action === 'Rejected') {
            // A rejection at any step immediately rejects the entire expense
            newExpenseStatus = 'Rejected';
            
        } else if (action === 'Approved') {
            // Check if there are any *other* Pending steps remaining
            const remainingPendingQuery = `
                SELECT EXISTS (
                    SELECT 1 FROM managerapproval 
                    WHERE expense_id = $1 AND action = 'Pending'
                ) AS remaining;
            `;
            const remainingResult = await client.query(remainingPendingQuery, [expense_id]);

            if (!remainingResult.rows[0].remaining) {
                // No more 'Pending' steps left, all must be 'Approved'
                newExpenseStatus = 'Approved';
            }
        }
        
        // --- 4. Update Overall Expense Status (if changed from Pending) ---
        if (newExpenseStatus !== 'Pending') {
            const updateExpenseQuery = `
                UPDATE expense
                SET status = $1
                WHERE expense_id = $2;
            `;
            await client.query(updateExpenseQuery, [newExpenseStatus, expense_id]);
        }
        
        await client.query('COMMIT'); // END TRANSACTION (SUCCESS)

        // Success response
        res.status(200).json({ 
            message: `Expense ${expense_id} approval step ${step_order} successfully processed.`, 
            action: action,
            new_expense_status: newExpenseStatus 
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK'); // ROLLBACK TRANSACTION on error
        }
        console.error('Error updating manager approval transaction:', error);
        res.status(500).json({ 
            error: 'Failed to process approval due to a server error. Transaction rolled back.', 
            detail: error.message 
        });
    } finally {
        if (client) {
            client.release(); // Release the database client back to the pool
        }
    }
}
