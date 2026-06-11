const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const Plan = require("../Models/plan");
const { authMiddleware } = require("../middleware/authMiddleware");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLAN_META = {
  starter: {
    name: "Starter",
    color: "#64748b",
    features: [
      "1 AI-generated resume",
      "3 templates",
      "PDF export",
      "ATS score checker",
      "Email support",
    ],
  },
  pro: {
    name: "Pro",
    color: "#2563eb",
    features: [
      "Unlimited AI resumes",
      "20+ premium templates",
      "PDF & DOCX export",
      "Real-time ATS optimization",
      "Cover letter generator",
      "LinkedIn profile sync",
      "Priority support",
    ],
  },
  elite: {
    name: "Elite",
    color: "#7c3aed",
    features: [
      "Everything in Pro",
      "Unlimited cover letters",
      "Interview prep AI coach",
      "Salary negotiation guide",
      "1-on-1 resume review",
      "Job application tracker",
      "Early access to new features",
      "Dedicated account manager",
    ],
  },
};

const buildDates = (billing) => {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (billing === "yearly") {
    endDate.setFullYear(endDate.getFullYear() + 1);
  } else {
    endDate.setMonth(endDate.getMonth() + 1);
  }

  return { startDate, endDate };
};

router.post("/create-payment-intent", authMiddleware, async (req, res) => {
  try {
    const { planId, billing, price } = req.body;

    if (!planId || !billing || !price) {
      return res.status(400).json({
        success: false,
        message: "planId, billing and price are required",
      });
    }

    const amount =
      billing === "yearly"
        ? Number(price) * 12 * 100
        : Number(price) * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        userId: req.user._id.toString(),
        email: req.user.email,
        planId,
        billing,
        pricePerMonth: String(price),
      },
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post("/create-plan", authMiddleware, async (req, res) => {
  try {
    const { planId, billing, price, stripePaymentIntentId } = req.body;

    if (!planId || !billing || !price) {
      return res.status(400).json({
        success: false,
        message: "planId, billing and price are required",
      });
    }

    const existing = await Plan.findOne({
      userId: req.user._id,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Plan already exists. Use update-plan instead.",
      });
    }

    const meta = PLAN_META[planId] || PLAN_META.pro;
    const { startDate, endDate } = buildDates(billing);

    const plan = await Plan.create({
      userId: req.user._id,
      email: req.user.email,
      planId,
      planName: meta.name,
      planColor: meta.color,
      planFeatures: meta.features,
      billing,
      pricePerMonth: Number(price),
      amountPaid:
        billing === "yearly"
          ? Number(price) * 12
          : Number(price),
      stripePaymentIntentId: stripePaymentIntentId || null,
      status: "active",
      startDate,
      endDate,
    });

    res.status(201).json({
      success: true,
      plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.put("/update-plan", authMiddleware, async (req, res) => {
  try {
    const { planId, billing, price, stripePaymentIntentId } = req.body;

    if (!planId || !billing || !price) {
      return res.status(400).json({
        success: false,
        message: "planId, billing and price are required",
      });
    }

    const meta = PLAN_META[planId] || PLAN_META.pro;
    const { startDate, endDate } = buildDates(billing);

    const plan = await Plan.findOneAndUpdate(
      { userId: req.user._id },
      {
        userId: req.user._id,
        email: req.user.email,
        planId,
        planName: meta.name,
        planColor: meta.color,
        planFeatures: meta.features,
        billing,
        pricePerMonth: Number(price),
        amountPaid:
          billing === "yearly"
            ? Number(price) * 12
            : Number(price),
        stripePaymentIntentId: stripePaymentIntentId || null,
        status: "active",
        startDate,
        endDate,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get("/my-plan", authMiddleware, async (req, res) => {
  try {
    const plan = await Plan.findOne({
      userId: req.user._id,
    });

    res.json({
      success: true,
      plan,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      return res.status(400).json({
        message: `Webhook signature error: ${err.message}`,
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;

      const {
        userId,
        email,
        planId,
        billing,
        pricePerMonth,
      } = intent.metadata;

      const meta = PLAN_META[planId] || PLAN_META.pro;
      const { startDate, endDate } = buildDates(billing);

      await Plan.findOneAndUpdate(
        { userId },
        {
          userId,
          email,
          planId,
          planName: meta.name,
          planColor: meta.color,
          planFeatures: meta.features,
          billing,
          pricePerMonth: Number(pricePerMonth),
          amountPaid:
            billing === "yearly"
              ? Number(pricePerMonth) * 12
              : Number(pricePerMonth),
          stripePaymentIntentId: intent.id,
          status: "active",
          startDate,
          endDate,
        },
        {
          new: true,
          upsert: true,
        }
      );
    }

    if (event.type === "payment_intent.payment_failed") {
      const intent = event.data.object;
      const { userId } = intent.metadata;

      await Plan.findOneAndUpdate(
        { userId },
        {
          status: "failed",
        }
      );
    }

    res.json({
      received: true,
    });
  }
);

module.exports = router;