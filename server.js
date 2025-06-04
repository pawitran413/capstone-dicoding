// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const { limiter } = require("./app/utils/rateLimiter");
const swaggerUi = require("swagger-ui-express");
const swaggerConfig = require("./app/config/swagger.config");

const app = express();

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URI || "mongodb://127.0.0.1:27017/auth_service", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:8081" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("combined"));
app.use(limiter);

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/prediction.routes")(app); // Tambah routes prediksi
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerConfig));

// Default route
app.get("/", (req, res) => {
  res.json({ 
    message: "Plant Disease Prediction API is running!",
    endpoints: {
      auth: "/api/auth/*",
      prediction: "/api/predict",
      history: "/api/predictions/history",
      docs: "/api/docs"
    }
  });
});

// Error handling middleware
const { errorHandler } = require("./app/middleware/errorHandler");
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api/docs`);
  console.log(`Prediction endpoint: http://localhost:${PORT}/api/predict`);
});

module.exports = app;
