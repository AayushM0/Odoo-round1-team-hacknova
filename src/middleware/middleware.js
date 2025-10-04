import jwt from "jsonwebtoken"
import "dotenv/config"
import { pool } from "../db/lib.js";


export const protectRouter = (roles = []) => async (req, res, next) => {
    // 1. Get tokens from cookies
    const accessToken = req.cookies?.accessToken; 
    const refreshToken = req.cookies?.refreshToken; 
    let decoded = null;

    // Default token expiration times (matching login/signup)
    const ACCESS_TOKEN_EXPIRY = "15m";
    const REFRESH_TOKEN_EXPIRY = "7d";
    const SECRET_KEY = process.env.JWT_SECRET_KEY;

    try {
        if (!accessToken && !refreshToken) {
            return res.status(401).json({ message: "Authentication required" });
        }

        // --- A. Attempt to verify Access Token ---
        if (accessToken) {
            try {
                decoded = jwt.verify(accessToken, SECRET_KEY);
            } catch (err) {
                // If it's anything other than an expired token, treat it as unauthorized
                if (err.name !== 'TokenExpiredError') {
                    console.log("Access token verification failed:", err.message);
                    return res.status(401).json({ message: "Invalid token" });
                }
                // If the access token is expired, proceed to refresh logic (B)
            }
        }

        // --- B. Refresh Token Logic (only if access token failed due to expiration) ---
        if (!decoded && refreshToken) {
            try {
                console.log("Access token expired. Attempting to refresh...");
                const refreshDecoded = jwt.verify(refreshToken, SECRET_KEY);
                
                // Use the user ID and role from the valid refresh token
                const { userid, role } = refreshDecoded;
                decoded = refreshDecoded;

                // Generate new Access and Refresh Tokens
                const newAccessToken = jwt.sign({ userid, role }, SECRET_KEY, { expiresIn: ACCESS_TOKEN_EXPIRY });
                const newRefreshToken = jwt.sign({ userid, role }, SECRET_KEY, { expiresIn: REFRESH_TOKEN_EXPIRY });
                
                // Set new tokens in cookies
                res.cookie("accessToken", newAccessToken, {
                    maxAge: 15 * 60 * 1000,
                    httpOnly: true,
                    sameSite: "strict",
                    secure: process.env.NODE_ENV === "production",
                });
                res.cookie("refreshToken", newRefreshToken, {
                    maxAge: 7 * 24 * 60 * 60 * 1000,
                    httpOnly: true,
                    sameSite: "strict",
                    secure: process.env.NODE_ENV === "production",
                });

                console.log("Tokens refreshed successfully.");

            } catch (err) {
                // Refresh token is invalid or expired
                console.log("Refresh token failed:", err.message);
                // Clear potentially bad cookies and force login
                res.clearCookie("accessToken");
                res.clearCookie("refreshToken");
                return res.status(401).json({ message: "Session expired, please log in." });
            }
        }

        // If after all attempts, we still don't have a decoded user, fail
        if (!decoded) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const { userid, role } = decoded;
        
        // 2. Role check
        if (roles.length && !roles.includes(role)) {
            return res.status(403).json({ message: "Forbidden: insufficient privileges" });
        }

        // 3. Fetch user from database
        const query =
            role === "admin"
                ? "SELECT admin_id AS id, name, email FROM admin WHERE admin_id = $1"
                : "SELECT employee_id AS id, name, email FROM employee WHERE employee_id = $1";

        const result = await pool.query(query, [userid]);

        const user = result.rows[0];

        if (!user) {
            console.error(`User ID ${userid} found in token but not in database.`);
            return res.status(401).json({ message: "Unauthorized - user not found" });
        }

        // 4. Attach user to request
        // Added check here, though it should be redundant due to the check above, 
        // it confirms that the structure is correct.
        if (!user.id) {
             console.error(`User object retrieved from DB is missing 'id' for user ${userid}.`);
             return res.status(500).json({ message: "Internal server error: User ID fetch failed." });
        }
        
        req.user = { ...user, role };
        next();
    } catch (err) {
        console.error("Error in protectRouter middleware:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};
