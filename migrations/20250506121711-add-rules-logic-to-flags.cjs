"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn("Flags", "rulesLogic", {
      type: Sequelize.ENUM("ANY", "ALL"),
      defaultValue: "ANY",
      allowNull: false,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn("Flags", "rulesLogic");
  },
};
