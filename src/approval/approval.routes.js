import express from "express"
import { Router } from "express";
const approvalrouter = express.Router();
import { updateManagerApproval,getPendingApprovals } from "./approval.controller.js";


approvalrouter.post("/modify",updateManagerApproval);
approvalrouter.get("/modify",getPendingApprovals);
export default approvalrouter;