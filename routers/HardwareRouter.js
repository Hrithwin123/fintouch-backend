import express from "express";
import { signup, pay, addFunds, getUserBalance, getVendorBalance, getAllUsers } from "../controllers/HardwareController.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/pay", pay);
router.post("/add-funds", addFunds);
router.get("/balance/:userId", getUserBalance);
router.get("/vendor-balance", getVendorBalance);
router.get("/users", getAllUsers);

export default router;
