const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    prompt: {
      type: String,
      default: null,
    },
    resumeText: {
      type: String,
      required: true,
    },
    pdf: {
      type: Buffer,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);