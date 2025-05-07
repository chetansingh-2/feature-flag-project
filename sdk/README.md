# Feature Flag SDK

A lightweight, high-performance client SDK for integrating feature flags into your applications.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Initialization Options](#initialization-options)
- [Core Concepts](#core-concepts)
  - [User Context](#user-context)
  - [Feature Evaluation](#feature-evaluation)
  - [Caching](#caching)
- [API Reference](#api-reference)
  - [Constructor](#constructor)
  - [Methods](#methods)
- [Best Practices](#best-practices)
- [Advanced Usage](#advanced-usage)
  - [Error Handling](#error-handling)
  - [Performance Optimization](#performance-optimization)
  - [Multiple Environments](#multiple-environments)
- [TypeScript Support](#typescript-support)
- [Troubleshooting](#troubleshooting)
- [Examples](#examples)

## Installation

Install the SDK using npm:

```bash
npm install feature-flag-sdk
```

Or using yarn:

```bash
yarn add feature-flag-sdk
```

## Quick Start

Here's how to get started with the SDK in just a few lines of code:

```javascript
import FeatureFlagClient from "feature-flag-sdk";

// Initialize the client
const client = new FeatureFlagClient("https://your-api-url.com/api");

// Set user context
client.setUser({
  id: "user-123",
  country: "US",
  accountType: "premium",
});

// Check if a feature is enabled (async)
async function renderPage() {
  const isNewFeatureEnabled = await client.isEnabled("new-feature");

  if (isNewFeatureEnabled) {
    renderNewFeature();
  } else {
    renderOldFeature();
  }
}
```

## Initialization Options

When initializing the SDK, you can provide several options to customize its behavior:

```javascript
const client = new FeatureFlagClient("https://your-api-url.com/api", {
  // Cache time-to-live in milliseconds (default: 60000 - 1 minute)
  cacheTTL: 120000, // 2 minutes

  // Enable debug logging (default: false)
  debug: true,

  // Initial user context (optional)
  user: {
    id: "user-123",
    country: "US",
  },
});
```

## Core Concepts

### User Context

The user context is a key concept in feature flagging. It's a set of attributes about the current user that are used to determine whether a feature should be enabled.

User attributes can include:

- Unique identifiers (`id`, `email`)
- Demographics (`country`, `language`)
- Account information (`accountType`, `subscriptionTier`)
- Behavioral data (`lastLoginDate`, `activityLevel`)

Example of setting user context:

```javascript
client.setUser({
  id: "user-123",
  email: "user@example.com",
  country: "US",
  accountType: "premium",
  subscriptionTier: "enterprise",
  betaTester: true,
});
```

You can update the user context at any time during the application lifecycle:

```javascript
// After user logs in
client.setUser({
  id: user.id,
  email: user.email,
  // ...other attributes
});

// After user updates their profile
client.setUser({
  ...client.getUser(), // Keep existing attributes
  country: newCountry,
});
```

### Feature Evaluation

When you check if a feature is enabled using `isEnabled()`, the SDK:

1. Checks the local cache first (if available)
2. If not in cache, sends the user context to the API
3. The API evaluates the user against the flag's rules
4. Returns whether the feature should be enabled
5. Caches the result for future checks

```javascript
// Basic check
const isEnabled = await client.isEnabled("new-checkout");

// Check with temporary user override
const isEnabledForSpecificUser = await client.isEnabled("new-checkout", {
  id: "different-user",
  country: "CA",
});
```

### Caching

The SDK implements caching to improve performance and reduce API calls. Each result is cached based on the flag name and user context.

Key caching behaviors:

- Cache hits avoid API calls, making checks near-instantaneous
- Cache entries expire after the configured TTL (default: 1 minute)
- Each unique combination of flag name and user context has its own cache entry
- You can manually clear the cache with `clearCache()`

```javascript
// Clear cache when needed (e.g., after user login)
client.clearCache();
```

## API Reference

### Constructor

```javascript
new FeatureFlagClient(apiUrl, options);
```

| Parameter | Type   | Required | Description                      |
| --------- | ------ | -------- | -------------------------------- |
| `apiUrl`  | string | Yes      | Base URL of the feature flag API |
| `options` | object | No       | Configuration options            |

**Options:**

| Option     | Type    | Default | Description                        |
| ---------- | ------- | ------- | ---------------------------------- |
| `cacheTTL` | number  | 60000   | Cache time-to-live in milliseconds |
| `debug`    | boolean | false   | Enable debug logging               |
| `user`     | object  | {}      | Initial user context               |

### Methods

#### `setUser(user)`

Sets the current user context for flag evaluations.

```javascript
client.setUser({
  id: "user-123",
  country: "US",
  accountType: "premium",
});
```

| Parameter | Type   | Required | Description                   |
| --------- | ------ | -------- | ----------------------------- |
| `user`    | object | Yes      | User attributes for targeting |

#### `getUser()`

Gets the current user context.

```javascript
const currentUser = client.getUser();
console.log(currentUser.id); // 'user-123'
```

Returns a copy of the current user context object.

#### `isEnabled(flagName, user?)`

Checks if a feature flag is enabled for the current user.

```javascript
const isEnabled = await client.isEnabled("new-checkout");
```

| Parameter  | Type   | Required | Description                          |
| ---------- | ------ | -------- | ------------------------------------ |
| `flagName` | string | Yes      | Name of the flag to check            |
| `user`     | object | No       | Override user context for this check |

Returns a Promise resolving to a boolean.

#### `getAllFlags()`

Gets all flags (primarily for admin purposes).

```javascript
const allFlags = await client.getAllFlags();
console.log(allFlags.length); // Number of flags
```

Returns a Promise resolving to an array of flag objects.

#### `clearCache()`

Clears the SDK's cache.

```javascript
client.clearCache();
```

## Best Practices

### Initialize Early

Initialize the SDK as early as possible in your application lifecycle:

```javascript
// In your application's entry point
import FeatureFlagClient from "feature-flag-sdk";

export const featureFlags = new FeatureFlagClient(
  "https://api.example.com/api"
);
```

### Set User Context After Authentication

Update the user context immediately after user authentication:

```javascript
// After login success
loginUser().then((user) => {
  featureFlags.setUser({
    id: user.id,
    email: user.email,
    country: user.country,
    // Other relevant attributes
  });
});
```

### Handle Loading States

Since flag checks are asynchronous, handle loading states appropriately:

```javascript
function MyComponent() {
  const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkFeature() {
      const enabled = await featureFlags.isEnabled("new-feature");
      setIsFeatureEnabled(enabled);
      setIsLoading(false);
    }

    checkFeature();
  }, []);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return isFeatureEnabled ? <NewFeature /> : <OldFeature />;
}
```

### Always Have Fallbacks

Always handle cases where feature flag checks might fail:

```javascript
try {
  const isEnabled = await featureFlags.isEnabled("new-checkout");
  showCheckout(isEnabled);
} catch (error) {
  // Log the error
  console.error("Feature flag check failed:", error);

  // Default to the stable version
  showCheckout(false);
}
```

## Advanced Usage

### Error Handling

The SDK includes a custom `FeatureFlagError` class for specific error handling:

```javascript
import FeatureFlagClient, { FeatureFlagError } from "feature-flag-sdk";

try {
  const isEnabled = await client.isEnabled("new-feature");
  // Use the result
} catch (error) {
  if (error instanceof FeatureFlagError) {
    // Handle SDK-specific errors
    console.error("Feature flag error:", error.message);
  } else {
    // Handle other errors
    console.error("Unexpected error:", error);
  }

  // Default to disabled
  return false;
}
```

### Performance Optimization

For highly performance-sensitive applications:

1. **Pre-fetch flags on startup**:

```javascript
// When your app initializes
async function initializeFlags() {
  // This will populate the ID mapping cache
  await client.getAllFlags();

  // Now future isEnabled() calls will be faster
}
```

2. **Adjust cache TTL based on your needs**:

```javascript
// Longer cache for less frequently changed flags
const client = new FeatureFlagClient(apiUrl, {
  cacheTTL: 300000, // 5 minutes
});
```

3. **Batch flag checks where possible**:

```javascript
// Instead of multiple separate calls
async function checkAllFeatures() {
  const [isFeatureAEnabled, isFeatureBEnabled, isFeatureCEnabled] =
    await Promise.all([
      client.isEnabled("feature-a"),
      client.isEnabled("feature-b"),
      client.isEnabled("feature-c"),
    ]);

  // Use results
}
```

### Multiple Environments

For applications that run in multiple environments:

```javascript
const environment = process.env.NODE_ENV;

const apiUrls = {
  development: "http://localhost:3000/api",
  staging: "https://staging-api.example.com/api",
  production: "https://api.example.com/api",
};

const client = new FeatureFlagClient(apiUrls[environment]);
```

## TypeScript Support

The SDK includes TypeScript definitions:

```typescript
import FeatureFlagClient from "feature-flag-sdk";

interface UserContext {
  id: string;
  email?: string;
  country?: string;
  accountType?: "free" | "premium" | "enterprise";
  [key: string]: any;
}

const client = new FeatureFlagClient<UserContext>(
  "https://api.example.com/api"
);

client.setUser({
  id: "user-123",
  accountType: "premium", // Type-checked
});

async function checkFeature(): Promise<boolean> {
  return client.isEnabled("new-feature");
}
```

## Troubleshooting

### Common Issues

**Issue: Flag always returns `false`**

- Verify the flag exists in your system
- Check that the user attributes match the targeting rules
- Ensure the API URL is correct
- Try clearing the cache with `client.clearCache()`

**Issue: Slow performance**

- Ensure you're properly utilizing caching
- Check network latency to your API
- Consider pre-fetching flags during initialization

**Issue: Network errors**

- Verify API endpoint is accessible
- Check for CORS issues if in browser environments
- Confirm your API is running and accessible

### Debug Mode

Enable debug mode to see detailed logs:

```javascript
const client = new FeatureFlagClient(apiUrl, { debug: true });
```

This will output detailed information about:

- Cache hits/misses
- API requests
- Evaluation results
- Errors and warnings

## Examples

### React Integration

```javascript
// src/services/featureFlags.js
import FeatureFlagClient from "feature-flag-sdk";

export const featureFlags = new FeatureFlagClient(
  "https://api.example.com/api"
);

// src/hooks/useFeatureFlag.js
import { useState, useEffect } from "react";
import { featureFlags } from "../services/featureFlags";

export function useFeatureFlag(flagName, defaultValue = false) {
  const [isEnabled, setIsEnabled] = useState(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function checkFlag() {
      try {
        const result = await featureFlags.isEnabled(flagName);
        if (isMounted) {
          setIsEnabled(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
          setIsEnabled(defaultValue);
          setIsLoading(false);
        }
      }
    }

    checkFlag();

    return () => {
      isMounted = false;
    };
  }, [flagName, defaultValue]);

  return { isEnabled, isLoading, error };
}

// Usage in component
function NewFeatureComponent() {
  const { isEnabled, isLoading } = useFeatureFlag("new-ui");

  if (isLoading) return <Spinner />;

  return isEnabled ? <NewUI /> : <OldUI />;
}
```

### Vue Integration

```javascript
// feature-flags.js
import FeatureFlagClient from "feature-flag-sdk";

export const featureFlags = new FeatureFlagClient(
  "https://api.example.com/api"
);

// Vue Plugin
export const FeatureFlagsPlugin = {
  install(app) {
    app.config.globalProperties.$featureFlags = featureFlags;

    // Add a directive for feature flags
    app.directive("feature", {
      async mounted(el, binding) {
        const flagName = binding.value;
        const enabled = await featureFlags.isEnabled(flagName);

        if (!enabled) {
          el.parentNode?.removeChild(el);
        }
      },
    });
  },
};

// main.js
import { createApp } from "vue";
import App from "./App.vue";
import { FeatureFlagsPlugin } from "./feature-flags";

const app = createApp(App);
app.use(FeatureFlagsPlugin);
app.mount("#app");

// Usage in component
// <div v-feature="'new-ui'">This is a new feature</div>
```

### Angular Integration

```typescript
// feature-flag.service.ts
import { Injectable } from "@angular/core";
import FeatureFlagClient from "feature-flag-sdk";
import { from, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class FeatureFlagService {
  private client = new FeatureFlagClient("https://api.example.com/api");

  setUser(user: any): void {
    this.client.setUser(user);
  }

  isEnabled(flagName: string): Observable<boolean> {
    return from(this.client.isEnabled(flagName));
  }

  clearCache(): void {
    this.client.clearCache();
  }
}

// app.component.ts
import { Component, OnInit } from "@angular/core";
import { FeatureFlagService } from "./feature-flag.service";
import { AuthService } from "./auth.service";

@Component({
  selector: "app-root",
  template: `
    <app-new-feature *ngIf="newFeatureEnabled"></app-new-feature>
    <app-old-feature *ngIf="!newFeatureEnabled"></app-old-feature>
  `,
})
export class AppComponent implements OnInit {
  newFeatureEnabled = false;

  constructor(
    private featureFlagService: FeatureFlagService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // Set user context
    this.authService.getUser().subscribe((user) => {
      this.featureFlagService.setUser(user);

      // Check feature flag
      this.featureFlagService.isEnabled("new-feature").subscribe((enabled) => {
        this.newFeatureEnabled = enabled;
      });
    });
  }
}
```

This SDK provides a robust, efficient way to integrate feature flags into your applications. By following the best practices outlined in this documentation, you can implement a sophisticated feature flag system that enhances your development workflow and user experience.
