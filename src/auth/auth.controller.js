import { pool } from "../db/lib.js";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt";
import { checkCompanyExists,addCompany,checkAdminExists,addAdmin } from "../db/queries.js";
import "dotenv/config";


export async function signup(req,res){
    const {companyname,name,currency,email,password} = req.body;
try{
    if(!companyname || !name || !currency || !email || !password){
        return res.status(400).json({message : "All fields are required"})

    }

    let companyExists = await checkCompanyExists(companyname);

    if(companyExists){
        console.log("Company already Exists");
        return res.status(400).json({message : "Company already exists"})
    }

    

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
     }

     const existingEmail =await checkAdminExists(email);

     if(existingEmail){
        return res.status(400).json({message : "email already exists - login"})
     }

       
    if(password.length <6){
        return res.status(400).json({message : "The password is too short please try again"})

     }

     const saltedPassword = await bcrypt.hash(password,10);

     try{
        await addCompany(companyname);
        companyExists = await checkCompanyExists(companyname);
    }
    catch(err){
        console.log("Error occured while adding a row the company table",err);
    }

     const newUser = await addAdmin(companyExists.company_id,name,email,saltedPassword,currency);

    const accessToken = jwt.sign(
       { userid: usedId, role }, // <-- Consistent payload keys
       process.env.JWT_SECRET_KEY,
       { expiresIn: "15m" } 
     );

     // Generate Refresh Token (Long-lived, for token refresh)
     const refreshToken = jwt.sign(
       { userid: usedId, role }, 
       process.env.JWT_SECRET_KEY,
       { expiresIn: "7d" }
     );
     
     // Set Access Token cookie
     res.cookie("accessToken", accessToken, {
            maxAge: 15 * 60 * 1000, // 15 minutes
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
          });

     // Set Refresh Token cookie
     res.cookie("refreshToken", refreshToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production",
          });


    res.status(201).json({ success: true, user: newUser });
}
catch(err){
    console.log("Error occured while trying to signup",err);
    return res.status(400).json({message : "Internal server error"})
}

}





export async function login(req, res) {
    try {
    const { email, password, role } = req.body;

    //  Required fields check
    if (!email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    //  Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    //  Password length check
    if (password.length < 6 || password.length > 128) {
      return res
        .status(400)
        .json({ message: "Password must be between 6 and 128 characters" });
    }

    //  Role check
    if (role !== "admin" && role !== "user") {
      return res.status(400).json({ message: "Role must be either admin or user" });
    }



    // Fetch user
            const result =
        role === "admin"
            ? await pool.query("SELECT * FROM admin WHERE email = $1", [email])
            : await pool.query("SELECT * FROM employee WHERE email = $1", [email]);

        const user = result.rows[0];
        console.log(user); // take the first row

        if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordMatched = await bcrypt.compare(password, user.password_hash);


    //  Compare password
    
    if (!passwordMatched) {
      console.warn("Login failed", { email, ip: req.ip, role });
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const usedId = role === "admin" ? user.admin_id : user.employee_id;
    console.log(role);
    //  Generate tokens
    const accessToken = jwt.sign(
      { userid: usedId, role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { userid: usedId, role },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

    //  Set cookies
    res.cookie("accessToken", accessToken, {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 15 * 60 * 1000, // 15 minutes
});

// Set Refresh Token (Long-lived, for refreshing the access token)
res.cookie("refreshToken", refreshToken, {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

    console.info("User logged in", { userid: usedId, role, ip: req.ip });

    return res.status(200).json({
      success: true,
      user: { id: usedId, email: user.email, role },
    });
  } catch (err) {
    console.error("Error during login", { error: err.message, stack: err.stack });
    return res.status(500).json({ message: "Internal server error" });
  }
}