// src/config/database.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";
// Use NeonDB connection string

dotenv.config();

const sequelize = new Sequelize(process.env.DATABASE_URL || "", {
  dialect: "postgres",
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully with NeonDB.");
  } catch (error) {
    console.error("Unable to connect to the NeonDB database:", error);
  }
};

testConnection();

export default sequelize;
