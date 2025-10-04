import { pool } from "../db/lib.js";

/**
 * Adds a new approval workflow for an employee.
 * The employee's direct manager is automatically included as the FIRST step,
 * giving them the highest priority.
 *
 * @param {object} req - The request object (should contain employee_id and optional approver_ids array in req.body).
 * @param {object} res - The response object.
 */
export async function addApprovalWorkflow(req, res) {
    // Expects:
    // employee_id: The ID of the employee this workflow applies to.
    // approver_ids: An optional array of employee_ids that are the custom approvers (following the manager).
    const { employee_id, approver_ids = [] } = req.body;

    // --- 1. Basic Input Validation ---
    if (!employee_id) {
        return res.status(400).json({ error: 'Missing required field: employee_id.' });
    }

    // Input validation: Ensure approver_ids is an array if present
    if (!Array.isArray(approver_ids)) {
        return res.status(400).json({ error: 'Invalid field: approver_ids must be an array of employee IDs.' });
    }

    let client;

    try {
        client = await pool.connect();

        // --- 2. Check for Existing Workflow ---
        const existingWorkflowQuery = `
            SELECT workflow_id FROM approvalworkflow
            WHERE employee_id = $1;
        `;
        const existingResult = await client.query(existingWorkflowQuery, [employee_id]);

        if (existingResult.rows.length > 0) {
            return res.status(409).json({ error: `Approval workflow already exists for employee ID ${employee_id}.` });
        }
        
        // --- 3. Fetch the Employee's Manager ID (The Default Approver) ---
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

        // -------------------------------------------------------------------
        // --- 4. Construct the Final Workflow Steps (PRIORITY CHANGE HERE) ---
        // The manager is now the FIRST approver, so they are placed at the start.
        // The custom approvers follow.
        const finalWorkflowSteps = [manager_id, ...approver_ids]; 
        
        // The original was: const finalWorkflowSteps = [...approver_ids, manager_id];
        // -------------------------------------------------------------------
        
        
        // Convert the array to a JSON string for storage in the 'steps' column
        const stepsJson = JSON.stringify(finalWorkflowSteps);
        
        // --- 5. Insert the New Workflow ---
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
            stepsJson // Store as JSON string
        ];

        const result = await client.query(insertSql, insertValues);

        res.status(201).json({
            message: 'Approval workflow added successfully',
            workflow_id: result.rows[0].workflow_id,
            final_steps: finalWorkflowSteps
        });

    } catch (error) {
        console.error('Error adding approval workflow:', error);
        
        // General error handling
        res.status(500).json({ error: 'Failed to add approval workflow due to a server error.', detail: error.message });
    } finally {
        if (client) {
            client.release();
        }
    }
}