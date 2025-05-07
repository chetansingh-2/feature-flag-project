// src/services/flagService.js
import { Flag, Rule } from "../models/index.js";

class FlagService {
  async createFlag(flagData) {
    try {
      const flag = await Flag.create(flagData);
      return flag;
    } catch (error) {
      console.error("Error creating flag:", error);
      throw error;
    }
  }

  async getAllFlags() {
    try {
      const flags = await Flag.findAll({
        include: Rule,
      });
      return flags;
    } catch (error) {
      console.error("Error fetching flags:", error);
      throw error;
    }
  }

  async getFlag(id) {
    try {
      const flag = await Flag.findByPk(id, {
        include: Rule,
      });
      return flag;
    } catch (error) {
      console.error(`Error fetching flag ${id}:`, error);
      throw error;
    }
  }

  async updateFlag(id, updates) {
    try {
      const flag = await Flag.findByPk(id);
      if (!flag) return null;

      await flag.update(updates);
      return flag;
    } catch (error) {
      console.error(`Error updating flag ${id}:`, error);
      throw error;
    }
  }

  async deleteFlag(id) {
    try {
      const flag = await Flag.findByPk(id);
      if (!flag) return false;

      await flag.destroy();
      return true;
    } catch (error) {
      console.error(`Error deleting flag ${id}:`, error);
      throw error;
    }
  }

  async addRule(flagId, ruleData) {
    try {
      const flag = await Flag.findByPk(flagId);
      if (!flag) return null;

      const rule = await Rule.create({
        ...ruleData,
        FlagId: flagId,
      });

      return rule;
    } catch (error) {
      console.error(`Error adding rule to flag ${flagId}:`, error);
      throw error;
    }
  }

  async removeRule(ruleId) {
    try {
      const rule = await Rule.findByPk(ruleId);
      if (!rule) return false;

      await rule.destroy();
      return true;
    } catch (error) {
      console.error(`Error removing rule ${ruleId}:`, error);
      throw error;
    }
  }
}

export default new FlagService();
//create obj and export it. It follow the singlton pttrn which share one instance of class across entire app
