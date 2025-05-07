// src/models/rule.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import Flag from "./flag.js";

const Rule = sequelize.define(
  "Rule",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    attribute: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    operator: {
      type: DataTypes.ENUM(
        "equals",
        "not_equals",
        "contains",
        "greater_than",
        "less_than"
      ),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

Flag.hasMany(Rule);
Rule.belongsTo(Flag);

export default Rule;
