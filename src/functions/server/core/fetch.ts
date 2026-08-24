// Centralized data fetching utilities with consistent error handling
import { airtableApiBase, airtableBaseId } from '@/config/settings.js';
import { logger, PerformanceTimer } from './logger.js';
import { AppError, NotFoundError } from './errors.js';
import type { FetchOptions, FetchResponse } from '@/types/index.js';

// Default fetch options
const DEFAULT_OPTIONS: FetchOptions = {
  timeout: 6000, // 6 seconds
  retries: 2,
  retryDelay: 1000 // 1 second
};

// Enhanced fetch with timeout, retries, and error handling
export async function enhancedFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  const timer = new PerformanceTimer(`Fetch ${url}`);
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= mergedOptions.retries!; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), mergedOptions.timeout);
      
      const response = await fetch(url, {
        ...mergedOptions,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new AppError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status
        );
      }
      
      const data = await response.json();
      timer.end({ status: response.status, attempt: attempt + 1 });
      
      return {
        data,
        status: response.status,
        headers: response.headers,
        success: true
      };
      
    } catch (error: any) {
      lastError = error;
      
      if (attempt < mergedOptions.retries!) {
        logger.warn(`Fetch attempt ${attempt + 1} failed, retrying...`, {
          url,
          error: error.message,
          attempt: attempt + 1
        });
        
        await new Promise(resolve => 
          setTimeout(resolve, mergedOptions.retryDelay! * (attempt + 1))
        );
      }
    }
  }
  
  timer.end({ success: false, attempts: mergedOptions.retries! + 1 });
  throw lastError || new AppError('Fetch failed after all retries');
}

// Airtable-specific fetch wrapper
export async function airtableFetch<T = any>(
  endpoint: string,
  options: FetchOptions = {},
  base: 'main' | 'portal' = 'main'
): Promise<FetchResponse<T>> {
  const apiKey = import.meta.env.AIRTABLE_API_KEY;
  const apiUrl = airtableApiBase();
  const baseId = airtableBaseId(base === 'portal' ? 'portal' : 'main');
  
  if (!apiKey || !apiUrl || !baseId) {
    throw new AppError('Airtable configuration missing', 500);
  }
  
  // Ensure proper URL construction without double slashes
  const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const cleanBaseId = baseId?.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  const urlObject = new URL(`${cleanApiUrl}/${cleanBaseId}/${cleanEndpoint}`);
  
  const fetchOptions: FetchOptions = {
    ...options,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  };
  
  try {
    return await enhancedFetch<T>(urlObject.toString(), fetchOptions);
  } catch (error: any) {
    logger.error('Airtable fetch failed', {
      endpoint,
      base,
      baseId,
      error: error.message,
      status: error.statusCode
    });
    throw error;
  }
}


// Generic API fetch wrapper
export async function apiFetch<T = any>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResponse<T>> {
  try {
    return await enhancedFetch<T>(url, options);
  } catch (error: any) {
    logger.error('API fetch failed', {
      url,
      error: error.message
    });
    throw error;
  }
}

// Batch fetch utility
export async function batchFetch<T = any>(
  requests: Array<{ url: string; options?: FetchOptions }>
): Promise<Array<FetchResponse<T> | Error>> {
  const timer = new PerformanceTimer(`Batch fetch (${requests.length} requests)`);
  
  try {
    const results = await Promise.allSettled(
      requests.map(({ url, options }) => enhancedFetch<T>(url, options))
    );
    
    const processedResults = results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return result.reason;
      }
    });
    
    timer.end({ 
      total: requests.length,
      successful: processedResults.filter(r => !(r instanceof Error)).length,
      failed: processedResults.filter(r => r instanceof Error).length
    });
    
    return processedResults;
  } catch (error) {
    timer.end({ success: false });
    throw error;
  }
}

// Cache utility for fetch responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export async function cachedFetch<T = any>(
  url: string,
  options: FetchOptions & { ttl?: number } = {}
): Promise<FetchResponse<T>> {
  const { ttl = 300000, ...fetchOptions } = options; // 5 minutes default TTL
  const cacheKey = `${url}:${JSON.stringify(fetchOptions)}`;
  
  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    logger.debug('Cache hit', { url });
    return {
      data: cached.data,
      status: 200,
      headers: new Headers(),
      success: true
    };
  }
  
  // Fetch and cache
  const result = await enhancedFetch<T>(url, fetchOptions);
  cache.set(cacheKey, {
    data: result.data,
    timestamp: Date.now(),
    ttl
  });
  
  logger.debug('Cache miss, fetched and cached', { url });
  return result;
}

// Clear cache utility
export function clearCache(pattern?: string): void {
  if (pattern) {
    const regex = new RegExp(pattern);
    for (const key of cache.keys()) {
      if (regex.test(key)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
  
  logger.info('Cache cleared', { pattern });
}
