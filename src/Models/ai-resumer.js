const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    email:{
      type: String,
      required: true
    },
    prompt: {
      type: String,
    },
    resumeText: {
      type: String,
    },
    pdf: {
      type: Buffer,
    },
    template: {
      type: String,
      default: "blue",
      enum: ["blue", "green", "black", "purple", "orange", "teal"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);