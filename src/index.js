const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const cookieParser = require("cookie-parser");
const {
  authenticationMiddleware,
  adminAuthorizationMiddleware,
} = require("./middlewares/authentication");
const { connectRedis } = require("./config/redis");
const { connectPublisherSubscriber } = require("./config/serverEvents");

dotenv.config();

const app = express();
connectDB();
connectRedis();
connectPublisherSubscriber();

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// Middleware
app.use(require("cors")(
  {
    origin: process.env.CLIENT_URL,
    credentials: true,
  }
));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(authenticationMiddleware);

// Routes
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminAuthorizationMiddleware, adminRoutes);

app.get("/", (req, res) => {
  res.send("Welcome from Gatekeeper Server!");
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});
