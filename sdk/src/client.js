import { createCache } from "./cache.js";
import { FeatureFlagError } from "./errors.js";

class FeatureFlagClient {
  constructor(apiUrl, options = {}) {
    this.apiUrl = apiUrl;
    if (!this.apiUrl) {
      throw new FeatureFlagError("API URL is required");
    }

    if (this.apiUrl.endsWith("/")) {
      this.apiUrl = this.apiUrl.slice(0, -1);
    }

    this.cache = createCache(options.cacheTTL);

    this.user = options.user || {};

    this._flagIdMapping = new Map();

    this.debug = options.debug || false;
  }

  setUser(user) {
    this.user = user || {};
    if (this.debug) {
      console.log("User context updated:", this.user);
    }
  }

  getUser() {
    return { ...this.user };
  }

  async isEnabled(flagName, user = this.user) {
    try {
      if (!flagName) {
        throw new FeatureFlagError("Flag name is required");
      }

      const cacheKey = `${flagName}-${JSON.stringify(user)}`;
      const cachedResult = this.cache.get(cacheKey);

      if (cachedResult !== undefined) {
        if (this.debug) {
          console.log(`Cache hit for ${flagName}`);
        }
        return cachedResult;
      }

      if (this.debug) {
        console.log(`Cache miss for ${flagName}, fetching from API`);
      }

      const flagId = await this._getFlagId(flagName);

      if (!flagId) {
        if (this.debug) {
          console.log(`Flag "${flagName}" not found`);
        }
        return false;
      }

      const response = await fetch(`${this.apiUrl}/flags/${flagId}/evaluate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user }),
      });

      if (!response.ok) {
        throw new FeatureFlagError(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      const result = !!data.enabled;

      this.cache.set(cacheKey, result);

      return result;
    } catch (error) {
      if (this.debug) {
        console.error(`Error checking flag ${flagName}:`, error);
      }

      return false;
    }
  }

  async getAllFlags() {
    try {
      const response = await fetch(`${this.apiUrl}/flags`);

      if (!response.ok) {
        throw new FeatureFlagError(
          `API error: ${response.status} ${response.statusText}`
        );
      }

      const flags = await response.json();

      flags.forEach((flag) => {
        this._flagIdMapping.set(flag.name, flag.id);
      });

      return flags;
    } catch (error) {
      if (this.debug) {
        console.error("Error fetching flags:", error);
      }
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
    if (this.debug) {
      console.log("Cache cleared");
    }
  }

  async _getFlagId(flagName) {
    if (this._flagIdMapping.has(flagName)) {
      return this._flagIdMapping.get(flagName);
    }

    const flags = await this.getAllFlags();
    const flag = flags.find((f) => f.name === flagName);

    return flag ? flag.id : null;
  }
}

export default FeatureFlagClient;
