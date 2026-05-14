import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    name: { type: String, required: true, default: "Main Counter" },
    balance: { type: Number, default: 0 }
});

export default mongoose.model("Vendor", vendorSchema);
