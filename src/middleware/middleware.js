import jwt from "jsonwebtoken"
import "dotenv/config"
import { pool } from "../db/lib.js";


export const protectRouter = (roles = []) => async (req, res, next) => {
  try {
    // Get JWT from cookies
    const token = req.cookies?.accessToken; 
    if (!token) {
      return res.status(401).json({ message: "User not logged in" });
    }

    

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      console.log(decoded);
    } catch (err) {
      console.log("JWT verification failed", err.message);
      return res.status(401).json({ message: "Unauthorized access" });
    }

    


    const { userid, role } = decoded;
    console.log(userid);
    console.log(role);

    // Check role if roles are specified
    if (roles.length && !roles.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient privileges" });
    }

    

    // Fetch user from database
    const query =
      role === "admin"
        ? "SELECT admin_id AS id, name, email FROM admin WHERE admin_id = $1"
        : "SELECT employee_id AS id, name, email FROM employee WHERE employee_id = $1";

    const result = await pool.query(query, [userid]);

    console.log("Query result rows:", result.rows);

    const user = result.rows[0];



    if (!user) {
      return res.status(401).json({ message: "Unauthorized - user not found" });
    }

    // Attach user to request
    req.user = { ...user, role };
    next();
  } catch (err) {
    console.error("Error in protectRouter middleware", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
