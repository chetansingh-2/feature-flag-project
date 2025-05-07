import dotenv from "dotenv";

import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { sequelize, Flag, Rule, syncDatabase } from "./models/index.js";
import flagRoutes from "./routes/flagRoutes.js";

const app = express();

dotenv.config();

app.use(cors());
app.use(bodyParser.json());

app.use("/api", flagRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await syncDatabase();

    app.listen(PORT, () => {
      console.log(`Feature flag service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
