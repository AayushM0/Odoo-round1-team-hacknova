import express from "express";
import cookieParser from "cookie-parser";
import authRouter from "./auth/auth.routes.js"
import { protectRouter } from "./middleware/middleware.js";
import expenseRouter from "./expense/expense.route.js";
import { addEmployee } from "./adminUpdatre/au.controller.js";
import aurouter from "./adminUpdatre/au.routes.js";
import wrouter from "./workflow/w.routes.js";
import approvalrouter from "./approval/approval.routes.js";
const app = express();




app.use(express.json());
app.use(cookieParser());

app.get("/dashboard", protectRouter(), (req, res) => {
    res.send(`Logged in and protectRouter works. Role: ${req.user.role}`);
});

app.use("/w",wrouter);

app.use("/auth",authRouter)
app.use("/expense",protectRouter(),expenseRouter);
app.use("/au",aurouter);
app.use("/approval",protectRouter(),approvalrouter);


app.listen(3000 , ()=>{
    console.log("App is listening on port 3000");
})