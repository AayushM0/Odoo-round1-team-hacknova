import express from "express"
import { Router } from "express";
const expenseRouter = express.Router();
import {createExp} from "./expense.controller.js"

expenseRouter.post("/create",createExp);

export default expenseRouter;