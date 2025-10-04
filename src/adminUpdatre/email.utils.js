import fs from 'fs/promises';
import path from 'path';


const LOG_FILE_PATH = path.join(process.cwd(), 'new_employee_passwords.txt');

/**
 * Writes the generated temporary password, employee name, and email 
 * to a local log file instead of sending an email.
 *
 * @param {string} name 
 * @param {string} email 
 * @param {string} password
 */
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
