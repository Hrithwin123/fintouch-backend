import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import Transaction from "../models/Transaction.js";

// Ensure a single vendor exists
const getMainVendor = async () => {
    let vendor = await Vendor.findOne({ name: "Main Counter" });
    if (!vendor) {
        vendor = new Vendor({ name: "Main Counter", balance: 0 });
        await vendor.save();
    }
    return vendor;
};

export const signup = async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.json({ success: false, message: "User ID is required" });
    }

    try {
        let user = await User.findOne({ fingerprintId: userId });
        if (user) {
            return res.json({ success: true, message: "User already exists" });
        }

        user = new User({
            fingerprintId: userId,
            name: `User_${userId}`
        });

        await user.save();
        console.log(`[SIGNUP] User created: ID ${userId}`);

        // Emit socket event
        const io = req.app.get('io');
        if (io) {
            io.emit('user_created', { userId, balance: user.balance });
        }

        res.json({ success: true, message: "Signup successful" });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const pay = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || amount === undefined || isNaN(amount) || amount <= 0) {
        return res.json({ success: false, message: "Invalid User ID or Amount" });
    }

    try {
        const user = await User.findOne({ fingerprintId: userId });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        if (user.balance < amount) {
            return res.json({ success: false, message: "Insufficient balance" });
        }

        const vendor = await getMainVendor();

        // Update balances
        user.balance -= Number(amount);
        vendor.balance += Number(amount);

        await user.save();
        await vendor.save();

        // Create transaction record
        const transaction = new Transaction({
            from: user.name,
            to: vendor.name,
            amount: amount
        });
        await transaction.save();

        console.log(`[PAY] Rs.${amount} from User ${userId} to Main Counter`);

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            io.emit('payment_received', { 
                userId, 
                amount, 
                userBalance: user.balance, 
                vendorBalance: vendor.balance 
            });
        }

        res.json({ success: true, message: "Payment successful" });
    } catch (error) {
        console.error("Payment error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const addFunds = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || amount === undefined || isNaN(amount) || amount <= 0) {
        return res.json({ success: false, message: "Invalid User ID or Amount" });
    }

    try {
        const user = await User.findOne({ fingerprintId: userId });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        user.balance += Number(amount);
        await user.save();

        console.log(`[DEPOSIT] Rs.${amount} added to User ${userId}. New balance: ${user.balance}`);

        // Emit socket events
        const io = req.app.get('io');
        if (io) {
            io.emit('funds_added', { 
                userId, 
                amount, 
                userBalance: user.balance 
            });
        }

        res.json({ success: true, message: "Funds added successfully", balance: user.balance });
    } catch (error) {
        console.error("Deposit error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getUserBalance = async (req, res) => {
    const { userId } = req.params;

    try {
        const user = await User.findOne({ fingerprintId: userId });
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }

        res.json({ success: true, balance: user.balance });
    } catch (error) {
        console.error("Get balance error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getVendorBalance = async (req, res) => {
    try {
        const vendor = await getMainVendor();
        res.json({ success: true, balance: vendor.balance });
    } catch (error) {
        console.error("Get vendor balance error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (error) {
        console.error("Get all users error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
