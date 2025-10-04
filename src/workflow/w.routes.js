import express from "express"
import { Router } from "express";
const wrouter = express.Router();
import { addApprovalWorkflow } from "./w.contoller.js";

wrouter.post("/create",addApprovalWorkflow);

export default wrouter;