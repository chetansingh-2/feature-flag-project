// src/controllers/flagController.js
import flagService from "../services/flagService.js";
import evaluationService from "../services/evaluationService.js";

const flagController = {
  async createFlag(req, res) {
    try {
      const { name, description, enabled = false } = req.body;
      const flag = await flagService.createFlag({ name, description, enabled });
      res.status(201).json(flag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getAllFlags(req, res) {
    try {
      const flags = await flagService.getAllFlags();
      res.json(flags);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async getFlag(req, res) {
    try {
      const flag = await flagService.getFlag(req.params.id);
      if (!flag) {
        return res.status(404).json({ error: "Flag not found" });
      }
      res.json(flag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateFlag(req, res) {
    try {
      const updatedFlag = await flagService.updateFlag(req.params.id, req.body);
      if (!updatedFlag) {
        return res.status(404).json({ error: "Flag not found" });
      }
      res.json(updatedFlag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteFlag(req, res) {
    try {
      const success = await flagService.deleteFlag(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Flag not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async addRule(req, res) {
    try {
      const { attribute, operator, value } = req.body;
      const rule = await flagService.addRule(req.params.id, {
        attribute,
        operator,
        value,
      });
      if (!rule) {
        return res.status(404).json({ error: "Flag not found" });
      }
      res.status(201).json(rule);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async removeRule(req, res) {
    try {
      const success = await flagService.removeRule(req.params.ruleId);
      if (!success) {
        return res.status(404).json({ error: "Rule not found" });
      }
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async evaluateFlag(req, res) {
    try {
      const { user = {} } = req.body;
      const isEnabled = await evaluationService.evaluate(req.params.id, user);
      res.json({ enabled: isEnabled });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default flagController;
