// src/routes/flagRoutes.js
import express from "express";
import flagController from "../controllers/flagController.js";

const router = express.Router();

router.post("/", flagController.createFlag);
router.get("/", flagController.getAllFlags);
router.get("/:id", flagController.getFlag);
router.put("/:id", flagController.updateFlag);
router.delete("/:id", flagController.deleteFlag);

router.post("/:id/rules", flagController.addRule);
router.delete("/:id/rules/:ruleId", flagController.removeRule);

router.post("/:id/evaluate", flagController.evaluateFlag);

export default router;
