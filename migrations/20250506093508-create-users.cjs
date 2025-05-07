// migrations/TIMESTAMP-create-flags-and-rules.js
"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Flags table
    await queryInterface.createTable("Flags", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    // Create Rules table
    await queryInterface.createTable("Rules", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      attribute: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      operator: {
        type: Sequelize.ENUM(
          "equals",
          "not_equals",
          "contains",
          "greater_than",
          "less_than"
        ),
        allowNull: false,
      },
      value: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      FlagId: {
        type: Sequelize.UUID,
        references: {
          model: "Flags",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Rules");
    await queryInterface.dropTable("Flags");
  },
};
