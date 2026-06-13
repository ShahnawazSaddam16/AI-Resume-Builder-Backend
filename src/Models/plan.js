const mongoose = require("mongoose");
const Billing = require("./billing");

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

PlanSchema.post("save", async function (doc) {
  try {
    const exists = await Billing.findOne({ planMongoId: doc._id });

    if (!exists) {
      await Billing.create({
        planMongoId: doc._id,
        userId: doc.userId,
        email: doc.email,
        planId: doc.planId,
        planName: doc.planName,
        planColor: doc.planColor,
        planFeatures: doc.planFeatures,
        billing: doc.billing,
        pricePerMonth: doc.pricePerMonth,
        amountPaid: doc.amountPaid,
        stripePaymentIntentId: doc.stripePaymentIntentId,
        status: doc.status,
        startDate: doc.startDate,
        endDate: doc.endDate,
      });
    }
  } catch (err) {
    console.error(err);
  }
});

module.exports = mongoose.model("Plan", PlanSchema);