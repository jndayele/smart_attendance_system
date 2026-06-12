// Error reporting stub - removed Lovable dependency
export function reportLovableError(error: unknown, context: Record<string, unknown> = {}) {
  // No-op: error reporting disabled
  console.error("Error reported:", error, context);
}
