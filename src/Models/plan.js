const mongoose = require("mongoose");

const PlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    email: { type: String, required: true },
    planId: { type: String, enum: ["starter", "pro", "elite"], required: true },
    planName: { type: String, required: true },
    planColor: { type: String, required: true },
    planFeatures: [{ type: String }],
    billing: { type: String, enum: ["monthly", "yearly"], required: true },
    pricePerMonth: { type: Number, required: true },
    amountPaid: { type: Number, required: true },
    stripePaymentIntentId: { type: String, default: null },
    status: { type: String, enum: ["active", "cancelled", "failed", "expired"], default: "active" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", PlanSchema);