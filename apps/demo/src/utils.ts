export function delay(time: number) {
  return new Promise((res) => setTimeout(res, time));
}

/**
 * Safely converts an unknown error into a human-readable string.
 */
export function errorToString(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (typeof error === "string") return error;

  // Handle case where error might be an object with a .message property
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
