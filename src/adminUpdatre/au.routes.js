import express from "express"
import { Router } from "express";
const aurouter = express.Router();
import {addEmployee  } from "./au.controller.js";

aurouter.post("/create",addEmployee);

export default aurouter;