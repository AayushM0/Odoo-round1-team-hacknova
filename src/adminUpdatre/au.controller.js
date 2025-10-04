import { pool } from "../db/lib.js";
import bcrypt from "bcrypt";



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
    
    // --- Basic Input Validation ---
    if (!name || !email || !role || !admin_id || !manager_name) {
        return res.status(400).json({ error: 'Missing required fields: name, email, role, admin_id, or manager_name.' });
    }

    let client; // Declare client outside try block

    try {
        client = await pool.connect(); // Checkout client from pool

        const managerQuery = `
            SELECT employee_id FROM employee 
            WHERE name = $1; 
        `;

        
        const managerResult = await client.query(managerQuery, [manager_name]); // Use client for query
        
        if (managerResult.rows.length === 0) {
            // Manager not found
            return res.status(404).json({ error: `Manager with name '${manager_name}' not found or is not designated as a Manager.` });
        }

        const manager_id = managerResult.rows[0].employee_id;
        console.log(`Manager ID found for ${manager_name}: ${manager_id}`);

        // --- PASSWORD HASHING ---
        const randomPassword = generateRandomPassword(16);
        console.log(`Generated Password for ${name}: ${randomPassword}`);

        const password_hash = await bcrypt.hash(randomPassword, SALT_ROUNDS);
        
        // --- EMPLOYEE INSERTION ---
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

        
        const result = await client.query(sql, values); // Use client for insertion
        const newEmployeeId = result.rows[0].employee_id;


        // --- LOG THE GENERATED PASSWORD TO FILE (Replaces Email) ---
        // CRITICAL FIX: AWAIT the file operation to ensure it completes before response is sent.
        await logPasswordToFile(name, email, randomPassword) 
            .catch(err => console.error("Warning: Failed to log password to file:", err));


        res.status(201).json({
            message: 'Employee added successfully and temporary password logged.',
            employee_id: newEmployeeId,
            manager_id: manager_id
        });

    } catch (error) {
        console.error('Error adding employee:', error);
        
        // Postgres unique violation code
        if (error.code === '23505') { 
            return res.status(409).json({ error: 'Email address already in use.' });
        }
        res.status(500).json({ error: 'Failed to add employee due to a server error.', detail: error.message });
        
    } finally {
        // CRITICAL: Ensure the client is released back to the pool
        if (client) {
            client.release();
        }
    }
}

import fs from 'fs/promises';
import path from 'path';

// Define the file path where passwords will be logged. 
// This creates a file named 'new_employee_passwords.txt' in the project root.
const LOG_FILE_PATH = path.join(process.cwd(), 'new_employee_passwords.txt');

/**
 * Writes the generated temporary password, employee name, and email 
 * to a local log file instead of sending an email.
 *
 * @param {string} name - Employee's full name.
 * @param {string} email - Employee's email address.
 * @param {string} password - The randomly generated password.
 */
export async function logPasswordToFile(name, email, password) {
    const logEntry = `\n--- New Employee Account ---\n` +
                     `Timestamp: ${new Date().toISOString()}\n` +
                     `Name: ${name}\n` +
                     `Email: ${email}\n` +
                     `Temporary Password: ${password}\n` +
                     `----------------------------\n`;

    try {
        // Use fs.appendFile to safely add content to the end of the file
        await fs.appendFile(LOG_FILE_PATH, logEntry);
        console.log(`\n--- PASSWORD LOGGED ---`);
        console.log(`Password for ${name} logged to: ${LOG_FILE_PATH}`);
        console.log(`-----------------------\n`);
        
    } catch (error) {
        console.error(`ERROR: Failed to write password file at ${LOG_FILE_PATH}:`, error);
    }
}
