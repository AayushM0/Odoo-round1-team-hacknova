import { pool } from "../db/lib.js";
import bcrypt from "bcrypt";
import { logPasswordToFile } from "./email.utils.js";
import fs from 'fs/promises';
import path from 'path';

function generateRandomPassword(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function addEmployee(req, res) {

    const { name, email, role, admin_id, manager_name } = req.body;
    const SALT_ROUNDS = 10;
    
    if (!name || !email || !role || !admin_id || !manager_name) {
        return res.status(400).json({ error: 'Missing required fields: name, email, role, admin_id, or manager_name.' });
    }

    let client;

    try {
        client = await pool.connect();

        const managerQuery = `
            SELECT employee_id FROM employee 
            WHERE name = $1; 
        `;

        
        const managerResult = await client.query(managerQuery, [manager_name]);
        
        if (managerResult.rows.length === 0) {
            return res.status(404).json({ error: `Manager with name '${manager_name}' not found or is not designated as a Manager.` });
        }

        const manager_id = managerResult.rows[0].employee_id;
        console.log(`Manager ID found for ${manager_name}: ${manager_id}`);

        const randomPassword = generateRandomPassword(16);
        console.log(`Generated Password for ${name}: ${randomPassword}`);

        const password_hash = await bcrypt.hash(randomPassword, SALT_ROUNDS);
        
        const sql = `
            INSERT INTO employee (
                admin_id, name, email, password_hash, role, manager_id
            )
            VALUES (
                $1, $2, $3, $4, $5, $6
            )
            RETURNING employee_id;
        `;
        
        const values = [
            admin_id,
            name,
            email,
            password_hash,
            role,
            manager_id
        ];

        
        const result = await client.query(sql, values);
        const newEmployeeId = result.rows[0].employee_id;


        await logPasswordToFile(name, email, randomPassword) 
            .catch(err => console.error("Warning: Failed to log password to file:", err));


        res.status(201).json({
            message: 'Employee added successfully and temporary password logged.',
            employee_id: newEmployeeId,
            manager_id: manager_id
        });

    } catch (error) {
        console.error('Error adding employee:', error);
        
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'Email address already in use.' });
        }
        res.status(500).json({ error: 'Failed to add employee due to a server error.', detail: error.message });
        
    } finally {
        if (client) {
            client.release();
        }
    }
}

const LOG_FILE_PATH = path.join(process.cwd(), 'new_employee_passwords.txt');

export async function logPasswordToFile(name, email, password) {
    const logEntry = `\n--- New Employee Account ---\n` +
                     `Timestamp: ${new Date().toISOString()}\n` +
                     `Name: ${name}\n` +
                     `Email: ${email}\n` +
                     `Temporary Password: ${password}\n` +
                     `----------------------------\n`;

    try {
        await fs.appendFile(LOG_FILE_PATH, logEntry);
        console.log(`\n--- PASSWORD LOGGED ---`);
        console.log(`Password for ${name} logged to: ${LOG_FILE_PATH}`);
        console.log(`-----------------------\n`);
        
    } catch (error) {
        console.error(`ERROR: Failed to write password file at ${LOG_FILE_PATH}:`, error);
    }
}

export const getPendingApprovals = async (req, res) => {

    const managerId = req.user.id;
    let client;

    try {
        client = await pool.connect();


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
                ma.manager_id = $1
                AND ma.action = 'Pending'
                AND e.status = 'Pending'
                AND ma.step_order = (
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


export const updateManagerApproval = async (req, res) => {
    
    const { approval_id, action, remarks = null } = req.body; 
    
    const managerId = req.user.id; 
    let client;
    const validActions = ['Approved', 'Rejected'];

    if (!approval_id || !action) {
        return res.status(400).json({ error: 'Missing required fields: approval_id and action.' });
    }
    if (!validActions.includes(action)) {
        return res.status(400).json({ error: `Invalid action. Must be one of: ${validActions.join(', ')}.` });
    }
    
    try {
        client = await pool.connect();
        await client.query('BEGIN'); 

        
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

        
        if (step_order > current_min_step) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: `Cannot process step ${step_order}. Step ${current_min_step} must be processed first.` });
        }
        
        
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

        
        if (action === 'Rejected') {
            
            newExpenseStatus = 'Rejected';
            
        } else if (action === 'Approved') {
            
            const remainingPendingQuery = `
                SELECT EXISTS (
                    SELECT 1 FROM managerapproval 
                    WHERE expense_id = $1 AND action = 'Pending'
                ) AS remaining;
            `;
            const remainingResult = await client.query(remainingPendingQuery, [expense_id]);

            if (!remainingResult.rows[0].remaining) {
                
                newExpenseStatus = 'Approved';
            }
        }
        
        
        if (newExpenseStatus !== 'Pending') {
            const updateExpenseQuery = `
                UPDATE expense
                SET status = $1
                WHERE expense_id = $2;
            `;
            await client.query(updateExpenseQuery, [newExpenseStatus, expense_id]);
        }
        
        await client.query('COMMIT');

        
        res.status(200).json({ 
            message: `Expense ${expense_id} approval step ${step_order} successfully processed.`, 
            action: action,
            new_expense_status: newExpenseStatus 
        });

    } catch (error) {
        if (client) {
            await client.query('ROLLBACK');
        }
        console.error('Error updating manager approval transaction:', error);
        res.status(500).json({ 
            error: 'Failed to process approval due to a server error. Transaction rolled back.', 
            detail: error.message 
        });
    } finally {
        if (client) {
            client.release();
        }
    }
}
