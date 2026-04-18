/**
 * Manus runtime stub for standalone mobile app.
 * Provides no-op implementations for web container integration.
 */
import type { Metrics } from "react-native-safe-area-context";

/**
 * Initialize Manus runtime for cookie injection from parent container.
 * No-op for standalone mobile builds.
 */
export function initManusRuntime(): void {
  // No-op for standalone mobile
}

/**
 * Subscribe to safe area insets updates from parent container.
 * No-op for standalone mobile builds.
 */
export function subscribeSafeAreaInsets(
  _callback: (metrics: Metrics) => void,
): () => void {
  // Return unsubscribe no-op
  return () => {};
}
