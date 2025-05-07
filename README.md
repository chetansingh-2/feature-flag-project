# Feature Flag System

A lightweight, flexible feature flag system for controlling feature releases without redeploying code. Built with Node.js, Express, Sequelize, and PostgreSQL.

## Features

- Toggle features on/off without code deployments
- Target specific users with custom rules
- RESTful API for flag management
- Simple SDK for application integration
- Rule-based targeting (country, account type, etc.)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/feature-flag-system.git
cd feature-flag-system

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

## Configuration

Set up your database connection in `.env`:

```
DATABASE_URL=postgres://your-neon-db-connection-string
PORT=3000
```

## Starting the Server

```bash
# Start the server
npm start

# For development with auto-reload
npm run dev
```

## API Usage

### Managing Feature Flags

```bash
# Create a new feature flag
curl -X POST http://localhost:3000/api/flags \
  -H "Content-Type: application/json" \
  -d '{
    "name": "new-checkout",
    "description": "New checkout experience",
    "enabled": true
  }'

# List all feature flags
curl -X GET http://localhost:3000/api/flags

# Get a specific flag
curl -X GET http://localhost:3000/api/flags/{flag-id}

# Update a flag
curl -X PUT http://localhost:3000/api/flags/{flag-id} \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": false
  }'

# Delete a flag
curl -X DELETE http://localhost:3000/api/flags/{flag-id}
```

### Managing Rules

```bash
# Add a rule to a flag
curl -X POST http://localhost:3000/api/flags/{flag-id}/rules \
  -H "Content-Type: application/json" \
  -d '{
    "attribute": "country",
    "operator": "equals",
    "value": "US"
  }'

# Remove a rule
curl -X DELETE http://localhost:3000/api/flags/{flag-id}/rules/{rule-id}
```

### Evaluating Flags

```bash
# Check if a flag is enabled for a user
curl -X POST http://localhost:3000/api/flags/{flag-id}/evaluate \
  -H "Content-Type: application/json" \
  -d '{
    "user": {
      "id": "user-123",
      "country": "US",
      "accountType": "premium"
    }
  }'
```

## Integration Guide

### 1. Install the SDK

```bash
npm install your-feature-flag-sdk
```

### 2. Initialize in Your Application

```javascript
// Import the SDK
import FeatureFlagClient from "feature-flag-sdk";

// Initialize the client
const client = new FeatureFlagClient("http://your-api-url/api");

// Set user context (typically after user login)
client.setUser({
  id: "user-123",
  country: "US",
  accountType: "premium",
  // Add any user properties you want to target
});
```

### 3. Check Feature Flags in Your Code

```javascript
// Using async/await
async function renderPage() {
  // Check if a feature is enabled for the current user
  const isNewFeatureEnabled = await client.isEnabled("new-feature");

  if (isNewFeatureEnabled) {
    // Show new feature
    renderNewFeature();
  } else {
    // Show old feature
    renderOldFeature();
  }
}

// Or using promises
function handlePayment() {
  client
    .isEnabled("new-payment-process")
    .then((isEnabled) => {
      if (isEnabled) {
        startNewPaymentFlow();
      } else {
        startOldPaymentFlow();
      }
    })
    .catch((error) => {
      // Always have a fallback for errors
      console.error("Error checking feature flag:", error);
      startOldPaymentFlow(); // Default to the old, stable version
    });
}
```

### 4. Best Practices

- **Fallbacks**: Always handle errors by defaulting to a safe state (usually the old feature)
- **Caching**: The SDK caches flag values for 60 seconds by default to reduce API calls
- **User Context**: Set the user context as early as possible in your application flow
- **Naming Conventions**: Use descriptive, consistent flag names like `new-checkout` or `beta-editor`

## SDK Methods

| Method                       | Description                           |
| ---------------------------- | ------------------------------------- |
| `setUser(user)`              | Set the current user context          |
| `isEnabled(flagName, user?)` | Check if a flag is enabled for a user |
| `getAllFlags()`              | Get all flags (admin use)             |
| `clearCache()`               | Clear the SDK's cache                 |

## Project Structure

```
feature-flag-system/
├── src/
│   ├── config/           # Database configuration
│   ├── controllers/      # Request handlers
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   └── index.js          # Entry point
├── sdk/                  # Client SDK
├── .env                  # Environment variables
└── package.json          # Dependencies
```

## Technology Stack

- **Backend**: Node.js, Express
- **Database**: PostgreSQL (NeonDB)
- **ORM**: Sequelize
- **SDK**: JavaScript (ES Modules)

## License

MIT

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.
