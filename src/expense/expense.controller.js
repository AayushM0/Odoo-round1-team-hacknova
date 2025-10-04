import { pool } from "../db/lib.js";

export const createExp = async (req, res) => {
    const {
        description,
        category = null,
        amount,
        currency,
        receipt_url = null,
        remarks = null,
    } = req.body;

    const employeeId = req.user.id; 
    
    let client;
    let expenseId;

    if (!description || !amount || !currency) {
        return res.status(400).json({ error: 'Missing required fields: description, amount, or currency.' });
    }
    if (isNaN(parseFloat(amount))) {
        return res.status(400).json({ error: 'Amount must be a valid number.' });
    }

    try {
        client = await pool.connect();
        await client.query('BEGIN');

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


        const workflowQuery = `
            SELECT steps FROM approvalworkflow
            WHERE employee_id = $1;
        `;
        const workflowResult = await client.query(workflowQuery, [employeeId]);
        
        let workflowSteps = [];
        
        if (workflowResult.rows.length > 0) {
            workflowSteps = workflowResult.rows[0].steps || [];

            if (typeof workflowSteps === 'string') {
                workflowSteps = JSON.parse(workflowSteps);
            }
            if (!Array.isArray(workflowSteps) || workflowSteps.length === 0) {
                console.warn(`Workflow found for employee ${employeeId} but steps array is empty.`);
            }

        } else {
            console.warn(`No approval workflow found for employee ${employeeId}. Expense status will be reverted to Draft.`);
            
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


        const insertApprovalsPromises = [];
        const managerApprovalQuery = `
            INSERT INTO managerapproval (expense_id, step_order, manager_id, action)
            VALUES ($1, $2, $3, 'Pending');
        `;

        workflowSteps.forEach((manager_id, index) => {
            insertApprovalsPromises.push(
                client.query(managerApprovalQuery, [
                    expenseId, 
                    index + 1, 
                    manager_id
                ])
            );
        });

        await Promise.all(insertApprovalsPromises);

        
        await client.query('COMMIT');

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
            await client.query('ROLLBACK');
        }
        console.error('Error in createExp transaction:', error);
        
        if (error.code === '23503') {
             return res.status(400).json({ error: 'Invalid employee ID or category/currency, or invalid manager ID found in the approval workflow steps.' });
        }
        
        res.status(500).json({ error: 'Failed to submit expense due to a server error. Transaction rolled back.', detail: error.message });
        
    } finally {
        if (client) {
            client.release();
        }
    }
}
