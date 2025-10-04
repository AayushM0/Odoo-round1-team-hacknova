import pkg from 'pg';
const { Pool } = pkg;

export const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password: "aayush1029384756",
    database: "Hacknova",
    port: 5432
});
