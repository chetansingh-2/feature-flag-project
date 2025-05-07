// src/models/index.js
import sequelize from "../config/database.js";
import Flag from "./flag.js";
import Rule from "./rule.js";

Flag.hasMany(Rule);
Rule.belongsTo(Flag);

const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false });
    console.log("Database models synchronized");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

export { sequelize, Flag, Rule, syncDatabase };
