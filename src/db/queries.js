import { pool } from "./lib.js";

export async function checkCompanyExists(companyName) {
  const query = 'SELECT company_id, name FROM Company WHERE name = $1';
  const values = [companyName];

  try {
    const res = await pool.query(query, values);

    if (res.rows.length > 0) {
      console.log("company exists")
      return res.rows[0];
    } else {
      console.log('company does not exist');
      return false;
    }
  } catch (err) {
    console.error('Error checking company:', err);
    throw err;
  }
}


export async function addCompany(companyName) {
  const query = 'INSERT INTO Company (name) VALUES ($1) RETURNING company_id, name';
  const values = [companyName];

  try {
    const res = await pool.query(query, values);
    console.log("added row to the company table")
  } catch (err) {
    console.error('Error adding company:', err);
    throw err;
  }
}


export async function checkAdminExists(adminEmail) {
  const query = 'SELECT name FROM admin WHERE email = $1';
  const values = [adminEmail];

  try {
    const res = await pool.query(query, values);

    if (res.rows.length > 0) {
      console.log('admin exists:', res.rows[0]);
      return true;
    } else {
      console.log('admin does not exist');
      return false;
    }
  } catch (err) {
    console.error('Error checking company:', err);
    throw err;
  }
}

export async function addAdmin(companyId, name, email, password,currency) {
  try {
    const query = `
      INSERT INTO Admin (company_id, name, email, password_hash ,currency)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING admin_id, name, email, company_id
    `;
    const values = [companyId, name, email, password,currency];

    const res = await pool.query(query, values);
    console.log('Admin added:', res.rows[0]);
    return res.rows[0];
  } catch (err) {
    console.error('Error adding admin:', err);
    throw err;
  }
}