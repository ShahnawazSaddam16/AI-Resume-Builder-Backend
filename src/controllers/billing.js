const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const limiter = require("../middleware/limiter");
const Plan = require("../Models/plan");
const Billing = require("../Models/billing");

router.post("/billings", authMiddleware, limiter, async (req, res) => {
  try {
    const {
      userId,
      planName,
      amount,
      currency,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeInvoiceId,
    } = req.body;

    const plan = await Plan.create({
      userId,
      planName,
      amount,
      currency,
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      stripeInvoiceId,
    });

    await Billing.create({
      userId: plan.userId,
      planId: plan._id,
      planName: plan.planName,
      amount: plan.amount,
      currency: plan.currency,
      status: plan.status,
      stripeCustomerId: plan.stripeCustomerId,
      stripeSubscriptionId: plan.stripeSubscriptionId,
      stripeInvoiceId: plan.stripeInvoiceId,
    });

    res.status(201).json({
      success: true,
      plan,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

router.get("/billings", authMiddleware, limiter, async (req, res) => {
  try {
    const billings = await Billing.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      billings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
