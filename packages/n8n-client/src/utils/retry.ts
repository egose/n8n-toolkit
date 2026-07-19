const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function isTransientError(error: unknown): boolean {
  if (error instanceof Error && 'status' in error) {
    return RETRYABLE_STATUS_CODES.has((error as { status: number }).status);
  }

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  return false;
}

export async function retryTransientError<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (!isTransientError(error) || attempt === attempts - 1) {
        throw error;
      }

      const delay = Math.min(1000 * 2 ** attempt, 10000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}
