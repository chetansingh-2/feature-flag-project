// sdk/src/errors.js
/**
 * Custom error class for feature flag errors
 */
export class FeatureFlagError extends Error {
  constructor(message) {
    super(message);
    this.name = "FeatureFlagError";
  }
}
