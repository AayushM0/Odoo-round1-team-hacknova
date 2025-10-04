import { pool } from "../db/lib.js";

export async function addApprovalWorkflow(req, res) {
    const { employee_id, approver_ids = [] } = req.body;

    if (!employee_id) {
        return res.status(400).json({ error: 'Missing required field: employee_id.' });
    }

    if (!Array.isArray(approver_ids)) {
        return res.status(400).json({ error: 'Invalid field: approver_ids must be an array of employee IDs.' });
    }

    let client;

    try {
        client = await pool.connect();

        const existingWorkflowQuery = `
            SELECT workflow_id FROM approvalworkflow
            WHERE employee_id = $1;
        `;
        const existingResult = await client.query(existingWorkflowQuery, [employee_id]);

        if (existingResult.rows.length > 0) {
            return res.status(409).json({ error: `Approval workflow already exists for employee ID ${employee_id}.` });
        }
        
        const managerQuery = `
            SELECT manager_id FROM employee
            WHERE employee_id = $1;
        `;
        
        const employeeResult = await client.query(managerQuery, [employee_id]);

        if (employeeResult.rows.length === 0) {
            return res.status(404).json({ error: `Employee with ID ${employee_id} not found.` });
        }
        
        const manager_id = employeeResult.rows[0].manager_id;
        
        if (!manager_id) {
            return res.status(400).json({ error: `Employee ID ${employee_id} does not have an assigned manager_id to be the first approver.` });
        }

        const finalWorkflowSteps = [manager_id, ...approver_ids]; 
        
        const stepsJson = JSON.stringify(finalWorkflowSteps);
        
        const insertSql = `
            INSERT INTO approvalworkflow (
                employee_id, steps, created_at
            )
            VALUES (
                $1, $2, NOW()
            )
            RETURNING workflow_id;
        `;
        
        const insertValues = [
            employee_id,
            stepsJson
        ];

        const result = await client.query(insertSql, insertValues);

        res.status(201).json({
            message: 'Approval workflow added successfully',
            workflow_id: result.rows[0].workflow_id,
            final_steps: finalWorkflowSteps
        });

    } catch (error) {
        console.error('Error adding approval workflow:', error);
        
        res.status(500).json({ error: 'Failed to add approval workflow due to a server error.', detail: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
}
