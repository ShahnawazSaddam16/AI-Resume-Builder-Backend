const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const dotenv = require("dotenv");
const dbConnection = require("./src/utils/dbConnection");
const cookieParser = require("cookie-parser");
const Auth = require("./src/controllers/auth");
const Plan = require("./src/controllers/plan");

dotenv.config();

const app = express();
const Port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser()); 


app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true
}));

// Routes
app.use("/api/auth", Auth);
app.use("/api", Plan);

// Mongoose connect
dbConnection();

app.listen(Port, (err) => {
  if (err) {
    console.error("❌❌ Error Connecting Server", err);
  } else {
    console.log(`✅✅ Server Running at http://localhost:${Port}`);
  }
});