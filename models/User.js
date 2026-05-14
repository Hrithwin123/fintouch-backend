import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    fingerprintId: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    balance: { type: Number, default: 1000 }, // Starting balance for testing
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", userSchema);
