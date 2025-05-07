// src/models/flag.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Flag = sequelize.define(
  "Flag",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rulesLogic: {
      type: DataTypes.ENUM("ANY", "ALL"),
      defaultValue: "ANY",
      allowNull: false,
    },
  },
  {
    timestamps: true,
  }
);

export default Flag;
