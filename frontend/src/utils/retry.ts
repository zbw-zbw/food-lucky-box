interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoff?: number;
  shouldRetry?: (error: any) => boolean;
}

export const retry = async <T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> => {
  const { maxAttempts = 3, delay = 1000, backoff = 2, shouldRetry = () => true } = options;

  let lastError: any;
  let attempt = 0;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw lastError;
      }

      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(backoff, attempt - 1)));
    }
  }

  throw lastError;
};
