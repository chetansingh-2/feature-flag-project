// src/services/evaluationService.js
import flagService from "./flagService.js";

//ye central hai to access new feature control

class EvaluationService {
  // Evaluate if a flag is enabled for a user
  async evaluate(flagId, user = {}) {
    try {
      const flag = await flagService.getFlag(flagId);

      if (!flag || !flag.enabled) {
        return false;
      }

      if (!flag.Rules || flag.Rules.length === 0) {
        return true;
      }

      return this.evaluateRules(flag.Rules, user, flag.rulesLogic);
    } catch (error) {
      console.error(`Error evaluating flag ${flagId}:`, error);
      return false;
    }
  }

  evaluateRules(rules, user, logicType) {
    const logic = logicType || "ANY";

    if (logic === "ALL") {
      return rules.every((rule) => this.evaluateRule(rule, user));
    } else {
      return rules.some((rule) => this.evaluateRule(rule, user));
    }
  }

  evaluateRule(rule, user) {
    const userValue = user[rule.attribute];

    if (userValue === undefined) {
      return false;
    }

    switch (rule.operator) {
      case "equals":
        return userValue === rule.value;
      case "not_equals":
        return userValue !== rule.value;
      case "contains":
        return String(userValue).includes(rule.value);
      case "greater_than":
        return Number(userValue) > Number(rule.value);
      case "less_than":
        return Number(userValue) < Number(rule.value);
      default:
        return false;
    }
  }
}

export default new EvaluationService();
