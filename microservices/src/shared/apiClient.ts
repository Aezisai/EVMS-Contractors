import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

const MAX_RETRIES = 5;
const INITIAL_BACKOFF_MS = 1000;

export async function fetchWithBackoff<T>(config: AxiosRequestConfig, retries = 0): Promise<AxiosResponse<T>> {
  try {
    const response = await axios(config);
    return response;
  } catch (error: any) {
    if (retries >= MAX_RETRIES) {
      console.error(`[API Client] Max retries reached for ${config.url}`);
      throw error;
    }

    // Check if error is retryable (5xx server errors or 429 Too Many Requests)
    if (error.response && (error.response.status === 429 || error.response.status >= 500)) {
      const delay = INITIAL_BACKOFF_MS * Math.pow(2, retries);
      console.warn(`[API Client] Error ${error.response.status} fetching ${config.url}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithBackoff(config, retries + 1);
    }
    
    // Non-retryable error (e.g., 401 Unauthorized, 404 Not Found)
    throw error;
  }
}
