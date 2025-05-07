# Feature Flag System: Comprehensive Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Project Overview](#project-overview)
3. [System Architecture](#system-architecture)
4. [Database Design](#database-design)
5. [API Design](#api-design)
6. [Implementation Details](#implementation-details)
   - [Project Structure](#project-structure)
   - [Models](#models)
   - [Services](#services)
   - [Controllers](#controllers)
   - [Routes](#routes)
   - [Core Evaluation Logic](#core-evaluation-logic)
7. [Rule Evaluation Logic](#rule-evaluation-logic)
8. [SDK Implementation](#sdk-implementation)
9. [Deployment](#deployment)
10. [Testing](#testing)
11. [Common Issues and Solutions](#common-issues-and-solutions)
12. [Portfolio and Interview Presentation](#portfolio-and-interview-presentation)
13. [Future Enhancements](#future-enhancements)

## Introduction

A feature flag system (also known as feature toggles or feature switches) is a software development technique that allows teams to modify system behavior without changing code. By wrapping features in conditional statements, developers can enable or disable functionality without deploying new code. This document provides comprehensive information about the implementation of a feature flag system, designed as a robust backend service that delivers feature flag configurations to client applications.

## Project Overview

### Purpose and Problem Statement

This feature flag system addresses several critical needs in modern software development:

1. **Decouple Deployment from Release**: Deploy code without immediately releasing features
2. **Targeted Rollouts**: Release features to specific user segments
3. **A/B Testing**: Test different implementations with real users
4. **Kill Switch**: Quickly disable problematic features
5. **Progressive Delivery**: Gradually increase the percentage of users who see a feature

### Technology Stack

- **Backend**: Node.js with Express.js (using ES Modules)
- **Database**: PostgreSQL via NeonDB
- **ORM**: Sequelize for database interactions
- **Authentication**: JWT (for production implementations)
- **Deployment**: Docker with Cloud Run (optional)

### Core Functionality

This feature flag system provides:

1. Flag management (CRUD operations)
2. Rule-based targeting with multiple operators
3. Evaluation engine for determining flag status
4. SDK for client applications
5. Rule logic options (ANY/ALL rules matching)

## System Architecture

The feature flag system follows a layered architecture with clear separation of concerns:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Admin UI       │────►│  Backend API    │◄────│  Client Apps    │
│  (Web Dashboard)│     │  (REST)         │     │  (With SDK)     │
│                 │     │                 │     │                 │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │                 │
                        │  Database       │
                        │  (PostgreSQL)   │
                        │                 │
                        └─────────────────┘
```

### Component Details

1. **Backend API**: Core of the system, handles flag management and evaluation

   - RESTful endpoints
   - Business logic in service layer
   - Database interactions via ORM

2. **Database**: Stores flags, rules, and their relationships

   - PostgreSQL for robust relational data storage
   - Sequelize ORM for database interactions
   - Well-defined relationships between entities

3. **Client SDK**: Library for applications to check flag status

   - Caching for performance
   - User context management
   - Flag evaluation requests

4. **Admin UI**: Interface for managing flags (optional component)
   - Flag creation and configuration
   - Rule management
   - Analytics and monitoring

### Request Flow

When a client application checks if a feature is enabled:

```
1. Application calls SDK: isEnabled('new-feature', user)
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Application │───►│ SDK Client  │───►│ Feature Flag│
   │             │    │             │    │ API         │
   └─────────────┘    └─────────────┘    └──────┬──────┘
                                                │
2. API processes request                        ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Flag        │◄───┤ Evaluation  │◄───┤ Controller  │
   │ Service     │───►│ Service     │───►│             │
   └─────────────┘    └─────────────┘    └──────┬──────┘
                                                │
3. Result returned to application               ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │ Application │◄───┤ SDK Client  │◄───┤ Feature Flag│
   │             │    │             │    │ API         │
   └─────────────┘    └─────────────┘    └─────────────┘
```

## Database Design

The database design consists of two main entities: Flags and Rules.

### Entity-Relationship Diagram

```
┌───────────────────┐
│ Flag              │
├───────────────────┤
│ id (UUID)         │
│ name (String)     │
│ description (Text)│
│ enabled (Boolean) │
│ rulesLogic (Enum) │
│ createdAt         │
│ updatedAt         │
└─────────┬─────────┘
          │
          │ hasMany
          ▼
┌───────────────────┐
│ Rule              │
├───────────────────┤
│ id (UUID)         │
│ attribute (String)│
│ operator (Enum)   │
│ value (String)    │
│ FlagId (UUID)     │
│ createdAt         │
│ updatedAt         │
└───────────────────┘
```

### Detailed Entity Descriptions

#### Flag Entity

| Field       | Type    | Description                                 |
| ----------- | ------- | ------------------------------------------- |
| id          | UUID    | Primary key, automatically generated        |
| name        | String  | Unique identifier for the flag              |
| description | Text    | Description of what the flag controls       |
| enabled     | Boolean | Master switch for the flag                  |
| rulesLogic  | Enum    | 'ANY' or 'ALL' - determines rule evaluation |
| createdAt   | Date    | Timestamp of creation                       |
| updatedAt   | Date    | Timestamp of last update                    |

#### Rule Entity

| Field     | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| id        | UUID   | Primary key, automatically generated     |
| attribute | String | User property to check (e.g., 'country') |
| operator  | Enum   | Type of comparison (e.g., 'equals')      |
| value     | String | Value to compare against                 |
| FlagId    | UUID   | Foreign key to the Flag entity           |
| createdAt | Date   | Timestamp of creation                    |
| updatedAt | Date   | Timestamp of last update                 |

### Relationships

- A Flag can have many Rules (one-to-many relationship)
- Each Rule belongs to exactly one Flag

### Operator Types

The Rule entity supports multiple operator types:

| Operator     | Description                                  |
| ------------ | -------------------------------------------- |
| equals       | Exact match of attribute and value           |
| not_equals   | Attribute doesn't match value                |
| contains     | String attribute contains value as substring |
| greater_than | Numeric attribute is greater than value      |
| less_than    | Numeric attribute is less than value         |

## API Design

The API follows RESTful principles with clearly defined resources and operations.

### Endpoints

#### Flag Management

| Method | Endpoint       | Description         |
| ------ | -------------- | ------------------- |
| POST   | /api/flags     | Create a new flag   |
| GET    | /api/flags     | List all flags      |
| GET    | /api/flags/:id | Get a specific flag |
| PUT    | /api/flags/:id | Update a flag       |
| DELETE | /api/flags/:id | Delete a flag       |

#### Rule Management

| Method | Endpoint                     | Description               |
| ------ | ---------------------------- | ------------------------- |
| POST   | /api/flags/:id/rules         | Add a rule to a flag      |
| DELETE | /api/flags/:id/rules/:ruleId | Remove a rule from a flag |

#### Evaluation

| Method | Endpoint                | Description                         |
| ------ | ----------------------- | ----------------------------------- |
| POST   | /api/flags/:id/evaluate | Evaluate a flag for a specific user |

### Request/Response Examples

#### Creating a Flag

**Request:**

```http
POST /api/flags
Content-Type: application/json

{
  "name": "new-checkout",
  "description": "New checkout experience",
  "enabled": true,
  "rulesLogic": "ANY"
}
```

**Response:**

```http
Status: 201 Created
Content-Type: application/json

{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "new-checkout",
  "description": "New checkout experience",
  "enabled": true,
  "rulesLogic": "ANY",
  "createdAt": "2023-05-06T12:00:00.000Z",
  "updatedAt": "2023-05-06T12:00:00.000Z"
}
```

#### Adding a Rule

**Request:**

```http
POST /api/flags/550e8400-e29b-41d4-a716-446655440000/rules
Content-Type: application/json

{
  "attribute": "country",
  "operator": "equals",
  "value": "US"
}
```

**Response:**

```http
Status: 201 Created
Content-Type: application/json

{
  "id": "660f9500-f30c-52e5-b827-557766550000",
  "attribute": "country",
  "operator": "equals",
  "value": "US",
  "FlagId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2023-05-06T12:30:00.000Z",
  "updatedAt": "2023-05-06T12:30:00.000Z"
}
```

#### Evaluating a Flag

**Request:**

```http
POST /api/flags/550e8400-e29b-41d4-a716-446655440000/evaluate
Content-Type: application/json

{
  "user": {
    "id": "user-123",
    "country": "US",
    "accountType": "premium"
  }
}
```

**Response:**

```http
Status: 200 OK
Content-Type: application/json

{
  "enabled": true
}
```

## Implementation Details

### Project Structure

```
feature-flag-system/
├── src/
│   ├── config/
│   │   └── database.js       # Database configuration
│   ├── controllers/
│   │   └── flagController.js # Request handlers
│   ├── models/
│   │   ├── flag.js           # Flag model definition
│   │   ├── rule.js           # Rule model definition
│   │   └── index.js          # Model relationships and exports
│   ├── routes/
│   │   └── flagRoutes.js     # API route definitions
│   ├── services/
│   │   ├── flagService.js    # Flag operations
│   │   └── evaluationService.js # Evaluation logic
│   └── index.js              # Application entry point
├── migrations/               # Database migrations
├── sdk/                      # Client SDK
├── .env                      # Environment variables
├── .sequelizerc              # Sequelize CLI configuration
├── package.json              # Dependencies and scripts
└── README.md                 # Project documentation
```

### Models

#### Flag Model

```javascript
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
```

#### Rule Model

```javascript
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

// Define the relationship
Flag.hasMany(Rule);
Rule.belongsTo(Flag);

export default Rule;
```

#### Model Index

```javascript
// src/models/index.js
import sequelize from "../config/database.js";
import Flag from "./flag.js";
import Rule from "./rule.js";

// Define relationships again to ensure they're set up
Flag.hasMany(Rule);
Rule.belongsTo(Flag);

// Sync all models with the database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ force: false }); // Set to true to drop and recreate tables
    console.log("Database models synchronized");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  }
};

export { sequelize, Flag, Rule, syncDatabase };
```

### Services

#### Flag Service

```javascript
// src/services/flagService.js
import { Flag, Rule } from "../models/index.js";

class FlagService {
  // Create a new flag
  async createFlag(flagData) {
    try {
      const flag = await Flag.create(flagData);
      return flag;
    } catch (error) {
      console.error("Error creating flag:", error);
      throw error;
    }
  }

  // Get all flags
  async getAllFlags() {
    try {
      const flags = await Flag.findAll({
        include: Rule, // Include the associated rules
      });
      return flags;
    } catch (error) {
      console.error("Error fetching flags:", error);
      throw error;
    }
  }

  // Get a flag by ID
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

  // Update a flag
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

  // Delete a flag
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

  // Add a rule to a flag
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

  // Remove a rule
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
```

#### Evaluation Service

```javascript
// src/services/evaluationService.js
import flagService from "./flagService.js";

class EvaluationService {
  // Evaluate if a flag is enabled for a user
  async evaluate(flagId, user = {}) {
    try {
      const flag = await flagService.getFlag(flagId);

      // Flag doesn't exist or is disabled globally
      if (!flag || !flag.enabled) {
        return false;
      }

      // No rules means enabled for everyone
      if (!flag.Rules || flag.Rules.length === 0) {
        return true;
      }

      // Check if user matches rules according to flag's logic
      return this.evaluateRules(flag.Rules, user, flag.rulesLogic);
    } catch (error) {
      console.error(`Error evaluating flag ${flagId}:`, error);
      return false; // Default to disabled on error
    }
  }

  // Determine if a user matches the targeting rules
  evaluateRules(rules, user, logicType = "ANY") {
    if (logicType === "ALL") {
      // ALL rules must match
      return rules.every((rule) => this.evaluateRule(rule, user));
    } else {
      // ANY rule can match (default)
      return rules.some((rule) => this.evaluateRule(rule, user));
    }
  }

  // Evaluate a single rule against a user
  evaluateRule(rule, user) {
    const userValue = user[rule.attribute];

    // Handle missing attributes
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
```

### Controllers

```javascript
// src/controllers/flagController.js
import flagService from "../services/flagService.js";
import evaluationService from "../services/evaluationService.js";

const flagController = {
  // Create a new flag
  async createFlag(req, res) {
    try {
      const {
        name,
        description,
        enabled = false,
        rulesLogic = "ANY",
      } = req.body;
      const flag = await flagService.createFlag({
        name,
        description,
        enabled,
        rulesLogic,
      });
      res.status(201).json(flag);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get all flags
  async getAllFlags(req, res) {
    try {
      const flags = await flagService.getAllFlags();
      res.json(flags);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get a specific flag
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

  // Update a flag
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

  // Delete a flag
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

  // Add a rule to a flag
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

  // Remove a rule
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

  // Evaluate a flag for a user
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
```

### Routes

```javascript
// src/routes/flagRoutes.js
import express from "express";
import flagController from "../controllers/flagController.js";

const router = express.Router();

// Flag routes
router.post("/", flagController.createFlag);
router.get("/", flagController.getAllFlags);
router.get("/:id", flagController.getFlag);
router.put("/:id", flagController.updateFlag);
router.delete("/:id", flagController.deleteFlag);

// Rule routes
router.post("/:id/rules", flagController.addRule);
router.delete("/:id/rules/:ruleId", flagController.removeRule);

// Evaluation route
router.post("/:id/evaluate", flagController.evaluateFlag);

export default router;
```

### Application Entry Point

```javascript
// src/index.js
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { syncDatabase } from "./models/index.js";
import flagRoutes from "./routes/flagRoutes.js";

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Register routes
app.use("/api/flags", flagRoutes);

// Sync database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Sync all models with the database
    await syncDatabase();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`Feature flag service running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();
```

### Database Configuration

```javascript
// src/config/database.js
import { Sequelize } from "sequelize";

// Connection to NeonDB PostgreSQL
const sequelize = new Sequelize(
  process.env.DATABASE_URL || "postgres://your-neondb-connection-string",
  {
    dialect: "postgres",
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Important for connecting to NeonDB
      },
    },
    logging: false, // Set to console.log to see SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connection established successfully with NeonDB.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

testConnection();

export default sequelize;
```

### Sequelize CLI Configuration

```javascript
// .sequelizerc
const path = require("path");

module.exports = {
  config: path.resolve("src/config", "database.cjs"),
  "models-path": path.resolve("src", "models"),
  "seeders-path": path.resolve("seeders"),
  "migrations-path": path.resolve("migrations"),
};
```

## Rule Evaluation Logic

The core of the feature flag system is the rule evaluation logic, which determines whether a flag should be enabled for a specific user.

### Evaluation Process

1. First, check if the flag exists and is globally enabled
2. If the flag has no rules, it's enabled for everyone
3. If there are rules, evaluate the user against the rules using the flag's logic type

### Logic Types

The system supports two types of rule evaluation logic:

1. **ANY Logic (Default)**: A flag is enabled if the user matches ANY of the rules
2. **ALL Logic**: A flag is enabled only if the user matches ALL of the rules

This flexibility allows for both simple and complex targeting scenarios:

#### Example: ANY Logic

```
Flag: new-checkout (enabled: true, rulesLogic: 'ANY')
Rules:
- country equals US
- accountType equals premium
```

With these rules, a user gets the feature if they're in the US OR they have a premium account.

#### Example: ALL Logic

```
Flag: premium-feature (enabled: true, rulesLogic: 'ALL')
Rules:
- subscription_type equals premium
- country equals US
```

With these rules, a user gets the feature only if they have a premium subscription AND they're in the US.

### Rule Operators

The system supports multiple comparison operators for flexible targeting:

- **equals**: Direct equality comparison
- **not_equals**: Negated equality comparison
- **contains**: String inclusion check (substring)
- **greater_than**: Numeric comparison for values above threshold
- **less_than**: Numeric comparison for values below threshold

### Decision Tree

The full evaluation process follows this decision tree:

```
                            ┌─────────────┐
                            │ Start       │
                            └──────┬──────┘
                                   │
                                   ▼
                            ┌─────────────┐
                            │ Flag exists?│
                            └──────┬──────┘
                                   │
                  No              │              Yes
          ┌──────────────────────┴───────────────────────┐
          │                                              │
          ▼                                              ▼
┌─────────────────┐                             ┌─────────────────┐
│ Return FALSE    │                             │ Flag enabled?   │
└─────────────────┘                             └───────┬─────────┘
                                                        │
                                          No            │            Yes
                                ┌────────────────────┴─────────────────────┐
                                │                                          │
                                ▼                                          ▼
                      ┌─────────────────┐                        ┌─────────────────┐
                      │ Return FALSE    │                        │ Has rules?      │
                      └─────────────────┘                        └───────┬─────────┘
                                                                         │
                                                           No            │            Yes
                                                 ┌────────────────────┴─────────────────────┐
                                                 │                                          │
                                                 ▼                                          ▼
                                       ┌─────────────────┐                        ┌─────────────────┐
                                       │ Return TRUE     │                        │ Check rules     │
                                       └─────────────────┘                        └───────┬─────────┘
                                                                                          │
                                                                                          │
                                                     ┌──────────────────────────────────┴─┴────────────────────────────────┐
                                                     │                                                                      │
                                                     ▼                                                                      ▼
                                       ┌─────────────────────────────┐                              ┌─────────────────────────────┐
                                       │ Logic type: ANY              │                              │ Logic type: ALL             │
                                       │ ANY rule matches?            │                              │ ALL rules match?            │
                                       └───────────────┬─────────────┘                              └───────────────┬─────────────┘
                                                      │                                                             │
                                  No                 │            Yes                             No                │             Yes
                       ┌────────────────────────┴─────────────────────┐                ┌────────────────────────┴─────────────────────┐
                       │                                              │                │                                              │
                       ▼                                              ▼                ▼                                              ▼
              ┌─────────────────┐                            ┌─────────────────┐      ┌─────────────────┐                    ┌─────────────────┐
              │ Return FALSE    │                            │ Return TRUE     │      │ Return FALSE    │                    │ Return TRUE     │
              └─────────────────┘                            └─────────────────┘      └─────────────────┘                    └─────────────────┘
```

## SDK Implementation

The SDK is a client library that applications use to check if features are enabled. It handles communication with the feature flag API and provides caching for performance.

### SDK Architecture

```
┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
│                   │      │                   │      │                   │
│  Client           │      │  Feature Flag     │      │  Feature Flag     │
│  Application      │◄────►│  SDK              │◄────►│  API              │
│                   │      │                   │      │                   │
└───────────────────┘      └───────────────────┘      └───────────────────┘
                                    │
                                    ▼
                           ┌───────────────────┐
                           │                   │
                           │  Local Cache      │
                           │                   │
                           └───────────────────┘
```

### SDK Code Implementation

```javascript
// sdk/featureFlagClient.js
export default class FeatureFlagClient {
  constructor(apiUrl, options = {}) {
    this.apiUrl = apiUrl;
    this.cache = new Map();
    this.cacheTTL = options.cacheTTL || 60000; // 1 minute default
    this.user = options.user || {};
  }

  // Set the current user
  setUser(user) {
    this.user = user;
  }

  // Check if a feature is enabled for the current user
  async isEnabled(flagName, user = this.user) {
    try {
      // Check cache first
      const cacheKey = `${flagName}-${JSON.stringify(user)}`;
      if (this.cache.has(cacheKey)) {
        const cachedData = this.cache.get(cacheKey);
        if (cachedData.expiry > Date.now()) {
          return cachedData.value;
        }
      }

      // Get flag ID from name
      const flags = await this.getAllFlags();
      const flag = flags.find((f) => f.name === flagName);

      if (!flag) {
        return false; // Flag doesn't exist
      }

      // Evaluate the flag
      const response = await fetch(`${this.apiUrl}/flags/${flag.id}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Cache the result
      this.cache.set(cacheKey, {
        value: data.enabled,
        expiry: Date.now() + this.cacheTTL,
      });

      return data.enabled;
    } catch (error) {
      console.error(`Error checking flag ${flagName}:`, error);
      return false; // Default to disabled on error
    }
  }

  // Get all flags (for admin purposes)
  async getAllFlags() {
    try {
      const response = await fetch(`${this.apiUrl}/flags`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching flags:", error);
      return [];
    }
  }

  // Clear the cache
  clearCache() {
    this.cache.clear();
  }
}
```

### The Purpose of Caching

Caching is a critical part of the SDK for several reasons:

1. **Performance**: Reducing network requests significantly improves application performance
2. **Reduced Server Load**: Fewer API calls means less load on your feature flag server
3. **Network Resilience**: Applications can continue functioning even with temporary API issues
4. **Bandwidth Efficiency**: Less data transferred between client and server

#### How Caching Works

The SDK implements a time-based caching strategy:

1. When `isEnabled()` is called, it first checks if the result is in the cache
2. If found and not expired, the cached result is returned immediately
3. If not found or expired, an API call is made and the result is stored in the cache
4. Each cached value has an expiration time (TTL = Time To Live)
5. Default TTL is 60,000 milliseconds (1 minute) but can be configured

The cache key is constructed from the flag name and user context, ensuring that different users or contexts get appropriate results.

### SDK Usage in Client Applications

```javascript
// Example React component using the SDK
import React, { useState, useEffect } from "react";
import FeatureFlagClient from "feature-flag-sdk";

function App() {
  const [showNewFeature, setShowNewFeature] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const client = new FeatureFlagClient("https://your-api-url.com/api");

    // Set user context
    client.setUser({
      id: "user-123",
      country: "US",
      accountType: "premium",
    });

    // Check if feature is enabled
    async function checkFeature() {
      setIsLoading(true);
      try {
        const isEnabled = await client.isEnabled("new-feature");
        setShowNewFeature(isEnabled);
      } catch (error) {
        console.error("Error checking feature flag:", error);
        setShowNewFeature(false); // Default to old feature on error
      } finally {
        setIsLoading(false);
      }
    }

    checkFeature();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {showNewFeature ? <NewFeatureComponent /> : <OldFeatureComponent />}
    </div>
  );
}
```

### Publishing SDK to NPM

To make your SDK available to other developers via npm:

1. **Prepare your package.json**:

```json
{
  "name": "your-feature-flag-sdk",
  "version": "1.0.0",
  "description": "SDK for feature flag management",
  "main": "dist/index.js",
  "files": ["dist"],
  "scripts": {
    "build": "babel src -d dist",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["feature-flags", "toggle", "sdk"],
  "author": "Your Name",
  "license": "MIT"
}
```

2. **Build your SDK**:

```bash
npm run build
```

3. **Publish to npm**:

```bash
npm login
npm publish
```

## Deployment

### Docker Containerization

Creating a Docker container for your feature flag system:

```dockerfile
# Use Node.js LTS version
FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Expose port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["node", "src/index.js"]
```

Create a `.dockerignore` file:

```
node_modules
npm-debug.log
.git
.env
```

### Cloud Run Deployment

Deploying to Google Cloud Run provides a serverless environment:

1. **Build the Docker image**:

```bash
docker build -t gcr.io/your-project-id/feature-flag-service:v1 .
```

2. **Push to Google Container Registry**:

```bash
gcloud auth configure-docker
docker push gcr.io/your-project-id/feature-flag-service:v1
```

3. **Deploy to Cloud Run**:

```bash
gcloud run deploy feature-flag-service \
  --image gcr.io/your-project-id/feature-flag-service:v1 \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="DATABASE_URL=your-database-url"
```

### CI/CD with Cloud Build

Setting up continuous deployment with Google Cloud Build:

1. Create a `cloudbuild.yaml` file:

```yaml
steps:
  # Build the container image
  - name: "gcr.io/cloud-builders/docker"
    args:
      [
        "build",
        "-t",
        "gcr.io/$PROJECT_ID/feature-flag-service:$COMMIT_SHA",
        ".",
      ]

  # Push the container image to Container Registry
  - name: "gcr.io/cloud-builders/docker"
    args: ["push", "gcr.io/$PROJECT_ID/feature-flag-service:$COMMIT_SHA"]

  # Deploy container image to Cloud Run
  - name: "gcr.io/google.com/cloudsdktool/cloud-sdk"
    entrypoint: gcloud
    args:
      - "run"
      - "deploy"
      - "feature-flag-service"
      - "--image"
      - "gcr.io/$PROJECT_ID/feature-flag-service:$COMMIT_SHA"
      - "--region"
      - "us-central1"
      - "--platform"
      - "managed"
      - "--allow-unauthenticated"
      - "--set-env-vars"
      - "DATABASE_URL=${_DATABASE_URL}"

substitutions:
  _DATABASE_URL: default-value # Will be overridden by actual secret

images:
  - "gcr.io/$PROJECT_ID/feature-flag-service:$COMMIT_SHA"
```

2. Connect your GitHub repository to Cloud Build in the Google Cloud Console
3. Create a trigger to build on commits to your main branch
4. Add a substitution variable for your database URL

## Testing

### API Testing with Postman

Here's a comprehensive approach to testing your feature flag API:

#### 1. Create a New Flag

**Request:**

- Method: `POST`
- URL: `{{base_url}}/flags`
- Headers:
  - Content-Type: `application/json`
- Body:

```json
{
  "name": "new-checkout",
  "description": "New checkout experience for premium users",
  "enabled": true,
  "rulesLogic": "ANY"
}
```

#### 2. Get All Flags

**Request:**

- Method: `GET`
- URL: `{{base_url}}/flags`

#### 3. Add Rules to the Flag

**Request:**

- Method: `POST`
- URL: `{{base_url}}/flags/{{flag_id}}/rules`
- Headers:
  - Content-Type: `application/json`
- Body:

```json
{
  "attribute": "country",
  "operator": "equals",
  "value": "US"
}
```

#### 4. Evaluate Flag (Matching User)

**Request:**

- Method: `POST`
- URL: `{{base_url}}/flags/{{flag_id}}/evaluate`
- Headers:
  - Content-Type: `application/json`
- Body:

```json
{
  "user": {
    "id": "user-123",
    "country": "US",
    "accountType": "premium"
  }
}
```

#### 5. Evaluate Flag (Non-Matching User)

**Request:**

- Method: `POST`
- URL: `{{base_url}}/flags/{{flag_id}}/evaluate`
- Headers:
  - Content-Type: `application/json`
- Body:

```json
{
  "user": {
    "id": "user-456",
    "country": "CA",
    "accountType": "standard"
  }
}
```

#### 6. Update Flag Rules Logic

**Request:**

- Method: `PUT`
- URL: `{{base_url}}/flags/{{flag_id}}`
- Headers:
  - Content-Type: `application/json`
- Body:

```json
{
  "rulesLogic": "ALL"
}
```

#### 7. Add Second Rule and Test ALL Logic

**Request:**

- Method: `POST`
- URL: `{{base_url}}/flags/{{flag_id}}/rules`
- Headers:
  - Content-Type: `application/json`
- Body:

```json
{
  "attribute": "accountType",
  "operator": "equals",
  "value": "premium"
}
```

Then evaluate with matching and non-matching users to verify ALL logic works.

### Unit Testing

Create unit tests to verify your core logic works correctly:

```javascript
// tests/evaluation.test.js
import { expect } from "chai";
import evaluationService from "../src/services/evaluationService.js";

describe("Evaluation Service", () => {
  const mockRules = [
    { attribute: "country", operator: "equals", value: "US" },
    { attribute: "accountType", operator: "equals", value: "premium" },
  ];

  const mockUser = {
    id: "user-123",
    country: "US",
    accountType: "premium",
  };

  describe("evaluateRule", () => {
    it("should return true for matching rule", () => {
      const result = evaluationService.evaluateRule(mockRules[0], mockUser);
      expect(result).to.be.true;
    });

    it("should return false for non-matching rule", () => {
      const result = evaluationService.evaluateRule(mockRules[0], {
        country: "CA",
      });
      expect(result).to.be.false;
    });
  });

  describe("evaluateRules with ANY logic", () => {
    it("should return true if any rule matches", () => {
      const result = evaluationService.evaluateRules(
        mockRules,
        { country: "US" },
        "ANY"
      );
      expect(result).to.be.true;
    });

    it("should return false if no rules match", () => {
      const result = evaluationService.evaluateRules(
        mockRules,
        { country: "CA", accountType: "standard" },
        "ANY"
      );
      expect(result).to.be.false;
    });
  });

  describe("evaluateRules with ALL logic", () => {
    it("should return true if all rules match", () => {
      const result = evaluationService.evaluateRules(
        mockRules,
        mockUser,
        "ALL"
      );
      expect(result).to.be.true;
    });

    it("should return false if not all rules match", () => {
      const result = evaluationService.evaluateRules(
        mockRules,
        { country: "US", accountType: "standard" },
        "ALL"
      );
      expect(result).to.be.false;
    });
  });
});
```

### Integration Testing

```javascript
// tests/integration.test.js
import request from "supertest";
import { expect } from "chai";
import app from "../src/index.js";

describe("Feature Flag API Integration Tests", () => {
  let flagId;
  let ruleId;

  it("should create a new flag", async () => {
    const response = await request(app).post("/api/flags").send({
      name: "test-feature",
      description: "Test feature flag",
      enabled: true,
    });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property("id");
    flagId = response.body.id;
  });

  it("should add a rule to the flag", async () => {
    const response = await request(app)
      .post(`/api/flags/${flagId}/rules`)
      .send({
        attribute: "country",
        operator: "equals",
        value: "US",
      });

    expect(response.status).to.equal(201);
    expect(response.body).to.have.property("id");
    ruleId = response.body.id;
  });

  it("should evaluate to true for matching user", async () => {
    const response = await request(app)
      .post(`/api/flags/${flagId}/evaluate`)
      .send({
        user: {
          id: "user-test",
          country: "US",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.enabled).to.be.true;
  });

  it("should evaluate to false for non-matching user", async () => {
    const response = await request(app)
      .post(`/api/flags/${flagId}/evaluate`)
      .send({
        user: {
          id: "user-test",
          country: "CA",
        },
      });

    expect(response.status).to.equal(200);
    expect(response.body.enabled).to.be.false;
  });

  it("should remove the rule", async () => {
    const response = await request(app).delete(
      `/api/flags/${flagId}/rules/${ruleId}`
    );

    expect(response.status).to.equal(204);
  });

  it("should delete the flag", async () => {
    const response = await request(app).delete(`/api/flags/${flagId}`);

    expect(response.status).to.equal(204);
  });
});
```

## Common Issues and Solutions

### Database Connection Issues

**Problem**: The application fails to connect to the NeonDB PostgreSQL database.

**Solution**:

1. Verify your connection string is correct
2. Ensure SSL configuration is properly set
3. Check that database credentials are valid
4. NeonDB might have connection limitations - check their documentation
5. Use proper error handling in your application

```javascript
// Better database connection error handling
const connectToDatabase = async () => {
  let retries = 5;
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log("Database connection established successfully.");
      return;
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      retries -= 1;
      console.log(`Retries left: ${retries}`);
      // Wait before trying again
      await new Promise((res) => setTimeout(res, 5000));
    }
  }
  throw new Error("Failed to connect to database after multiple attempts");
};
```

### Import Path Issues

**Problem**: Node.js cannot find modules due to incorrect import paths.

**Solution**:

1. Use relative paths with `./` or `../` prefixes
2. Ensure file extensions (`.js`) are included in imports
3. Check for typos in filenames or paths
4. Verify package.json has `"type": "module"` for ES modules

```javascript
// Correct relative imports
// For files in the same directory
import { something } from "./fileName.js";

// For files in a subdirectory
import { something } from "./subdirectory/fileName.js";

// For files in a parent directory
import { something } from "../fileName.js";

// For files in a sibling directory
import { something } from "../siblingDirectory/fileName.js";
```

### Missing Database Tables

**Problem**: The application fails because database tables don't exist.

**Solution**:

1. Ensure you've run database migrations or used `sequelize.sync()`
2. Check that database models are correctly defined
3. Verify database user has permission to create tables
4. For NeonDB, ensure you're connecting to the correct database

```javascript
// Safer database synchronization
const syncDatabase = async () => {
  try {
    // Check if tables exist first
    const [results] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );

    const tableExists = results.some((r) => r.table_name === "Flags");

    if (!tableExists) {
      console.log("Tables not found, creating database schema...");
      await sequelize.sync({ force: false });
      console.log("Database synchronized successfully");
    } else {
      console.log("Tables already exist, skipping sync");
    }
  } catch (error) {
    console.error("Error synchronizing database:", error);
    throw error;
  }
};
```

### CORS Issues when Integrating SDK

**Problem**: Client applications receive CORS errors when trying to use the SDK.

**Solution**:

1. Configure CORS properly in your Express application
2. Ensure your API allows requests from client domains

```javascript
// Better CORS configuration
import cors from "cors";

// For development (allows all origins)
app.use(cors());

// For production (restrict to specific origins)
const corsOptions = {
  origin: ["https://yourapplication.com", "https://dev.yourapplication.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
```

## Portfolio and Interview Presentation

When presenting this project in your portfolio or during interviews, emphasize the following aspects:

### Key Talking Points

1. **Problem-Solving**: "I built this feature flag system to solve the problem of decoupling deployment from release, allowing safer and more controlled feature rollouts."

2. **Architecture Decisions**: "I implemented a service-oriented architecture with clear separation of concerns. This makes the codebase maintainable and extendable."

3. **Database Design**: "The database design consists of two main entities with a one-to-many relationship, allowing for flexible rule creation and efficient queries."

4. **Rule Evaluation Logic**: "I implemented both ANY and ALL logic modes for rule evaluation, giving users flexibility in how they target their features."

5. **SDK Implementation**: "The SDK includes local caching to improve performance and reduce server load, with configurable TTL."

6. **Modern JavaScript**: "I used ES modules and modern JavaScript features like async/await, making the code cleaner and more maintainable."

### Architecture Diagrams for Interviews

Be prepared to sketch or explain these diagrams during interviews:

1. **System Architecture**: Overall components and their interactions
2. **Database Schema**: Tables, relationships, and key fields
3. **Request Flow**: How requests move through the system
4. **Evaluation Logic**: Decision tree for determining if a flag is enabled

### Code Review Preparation

Be ready to walk through and explain these key code sections:

1. **Flag Evaluation Logic**: The core algorithm that determines if a feature is enabled
2. **SDK Caching Logic**: How the SDK improves performance through caching
3. **Database Models**: How you structured your data and relationships
4. **API Design**: RESTful endpoints and their implementation

### Portfolio Presentation

For your GitHub portfolio:

1. Create a clear README.md with:

   - Project overview and purpose
   - Key features
   - Architecture diagrams
   - Installation instructions
   - API documentation
   - SDK usage examples

2. Include screenshots of:

   - API responses
   - Example flag configurations
   - Client application using your SDK

3. Highlight the problems solved:
   - Safe feature deployment
   - Targeted user segments
   - A/B testing capability
   - Emergency kill switch

## Future Enhancements

To further improve your feature flag system, consider these enhancements:

### 1. Percentage Rollouts

Implement a percentage-based rollout mechanism:

```javascript
// Add to evaluationService.js
evaluatePercentageRule(rule, user) {
  // Generate a consistent hash based on user ID
  const hash = this.generateStableHash(user.id);
  // Convert hash to a percentage (0-100)
  const userPercentile = hash % 100;
  // Check if user falls within the rollout percentage
  return userPercentile < rule.percentage;
}

generateStableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}
```

### 2. Admin Dashboard

Create a simple web interface for managing flags:

- Flag creation and editing
- Rule management
- Metrics and analytics
- User targeting visualization

### 3. Audit Logging

Track changes to flags for security and debugging:

```javascript
// Add to flagService.js
async updateFlag(id, updates, userId) {
  try {
    const flag = await Flag.findByPk(id);
    if (!flag) return null;

    // Log the change
    await AuditLog.create({
      entityType: 'flag',
      entityId: id,
      action: 'update',
      userId: userId,
      previousValue: JSON.stringify(flag),
      newValue: JSON.stringify({...flag, ...updates})
    });

    await flag.update(updates);
    return flag;
  } catch (error) {
    console.error(`Error updating flag ${id}:`, error);
    throw error;
  }
}
```

### 4. Scheduled Changes

Allow flags to be automatically enabled/disabled at specific times:

```javascript
// Add to flag model
const Flag = sequelize.define("Flag", {
  // Existing fields...
  scheduledEnableAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  scheduledDisableAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
});

// Add scheduled job to check and update flags
const checkScheduledFlags = async () => {
  const now = new Date();

  // Enable scheduled flags
  await Flag.update(
    { enabled: true },
    {
      where: {
        scheduledEnableAt: { [Op.lte]: now },
        enabled: false,
      },
    }
  );

  // Disable scheduled flags
  await Flag.update(
    { enabled: false },
    {
      where: {
        scheduledDisableAt: { [Op.lte]: now },
        enabled: true,
      },
    }
  );
};

// Run this job periodically
setInterval(checkScheduledFlags, 60000); // Every minute
```

### 5. A/B Testing Analytics

Add analytics tracking to measure the impact of features:

```javascript
// Add to evaluationService.js
async evaluate(flagId, user = {}) {
  // Existing evaluation code...

  // Track the evaluation for analytics
  await AnalyticsEvent.create({
    flagId,
    userId: user.id,
    timestamp: new Date(),
    result: isEnabled,
    userContext: JSON.stringify(user)
  });

  return isEnabled;
}
```

### 6. Multi-Variant Flags

Support multiple variations beyond simple on/off:

```javascript
// New model for variations
const Variation = sequelize.define(
  "Variation",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    flagId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    value: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    weight: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    }
  }
);

// Modified evaluation to return variation
async evaluateVariation(flagId, user = {}) {
  // Check if flag is enabled first
  const isEnabled = await this.evaluate(flagId, user);

  if (!isEnabled) {
    return null; // Flag is off, no variation
  }

  // Get variations for this flag
  const variations = await Variation.findAll({
    where: { flagId }
  });

  if (!variations.length) {
    return true; // No variations, just return enabled
  }

  // Select variation based on consistent hashing
  const hash = this.generateStableHash(user.id);
  const totalWeight = variations.reduce((sum, v) => sum + v.weight, 0);
  const userValue = hash % totalWeight;

  let currentWeight = 0;
  for (const variation of variations) {
    currentWeight += variation.weight;
    if (userValue < currentWeight) {
      return variation.value;
    }
  }

  // Fallback to first variation
  return variations[0].value;
}
```

By implementing these enhancements, you can transform your basic feature flag system into a fully-featured enterprise-grade solution.
