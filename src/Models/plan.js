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
  await Billing.findOneAndUpdate(
    { planMongoId: doc._id },
    {
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
    },
    {
      upsert: true,
      new: true,
    }
  );
});

PlanSchema.post("findOneAndUpdate", async function () {
  const doc = await this.model.findOne(this.getQuery());

  if (!doc) return;

  await Billing.findOneAndUpdate(
    { planMongoId: doc._id },
    {
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
    },
    {
      upsert: true,
      new: true,
    }
  );
});

PlanSchema.post("findOneAndDelete", async function (doc) {
  if (!doc) return;

  await Billing.deleteOne({
    planMongoId: doc._id,
  });
});

PlanSchema.post("findByIdAndDelete", async function (doc) {
  if (!doc) return;

  await Billing.deleteOne({
    planMongoId: doc._id,
  });
});

const Plan = mongoose.model("Plan", PlanSchema);

async function deleteExpiredPlans() {
  const expiredPlans = await Plan.find({ endDate: { $lte: new Date() } }).select("_id userId");

  for (const plan of expiredPlans) {
    await Plan.findOneAndDelete({ _id: plan._id, userId: plan.userId });
  }
}

setInterval(deleteExpiredPlans, 60 * 1000);

module.exports = Plan;