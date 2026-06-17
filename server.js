const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dbConnection = require("./src/utils/dbConnection");
const cookieParser = require("cookie-parser");
const Auth = require("./src/controllers/auth");
const Plan = require("./src/controllers/plan");
const AIResume = require("./src/controllers/ai-resume");
const Billing = require("./src/controllers/billing");
const MyResume = require("./src/controllers/my-resume");
const Profile = require("./src/controllers/profile");

dotenv.config();

const app = express();
const Port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser()); 


app.use(cors({
  origin: ["http://localhost:3000", "https://resume-ai.buttnetworks.com"],
  credentials: true
}));

// Routes
app.use("/api/auth", Auth);
app.use("/api", Plan);
app.use("/api", AIResume);
app.use("/api", Billing);
app.use("/api", MyResume);
app.use("/api", Profile);

// Mongoose connect
dbConnection();

app.listen(Port, (err) => {
  if (err) {
    console.error("❌❌ Error Connecting Server", err);
  } else {
    console.log(`✅✅ Server Running at http://localhost:${Port}`);
  }
});