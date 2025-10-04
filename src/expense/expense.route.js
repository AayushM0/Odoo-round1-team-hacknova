import express from "express"
import { Router } from "express";
const expenseRouter = express.Router();
import { createExpense } from "./exController.js";

expenseRouter.post("/create",createExpense);

export default expenseRouter;