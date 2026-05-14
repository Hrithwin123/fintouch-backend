import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    from: { type: String, required: true },
    to: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});

export default mongoose.model("Transaction", transactionSchema);
