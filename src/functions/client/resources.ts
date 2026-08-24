/**
 * Client-side resource functions
 * These functions call the API endpoints for resources and behaviours
 */

import { settings } from '@/config/settings.js';

export interface BehaviourSearchResult {
  "Record ID": string;
  "Name": string;
  "Type"?: string;
  "Purpose"?: string[];
  "Provision"?: string[];
}

export interface ResourceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Search for behaviours
 */
export async function searchBehaviours(query: string): Promise<ResourceResponse<BehaviourSearchResult[]>> {
  try {
    console.log('🔍 CLIENT: Searching behaviours with AI...', { query });
    
    // Call the Firebase Functions AI endpoint
    const response = await fetch(`${settings.firebase.functionsApiUrl}/search-behaviours`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    console.log('🔍 CLIENT: AI Search response received', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('🔍 CLIENT: AI Search failed', errorText);
      return {
        success: false,
        error: errorText || 'AI Search failed'
      };
    }

    const data = await response.json();
    console.log('🔍 CLIENT: AI Search successful', { resultCount: data.matches?.length || 0 });

    // Transform the AI response to match our expected format
    const transformedData = data.matches?.map((match: any) => ({
      "Record ID": match["Record ID"],
      "Name": match["Name"],
      "Type": match["Type"],
      "Purpose": [], // AI endpoint doesn't return Purpose/Provision
      "Provision": []
    })) || [];

    return {
      success: true,
      data: transformedData
    };

  } catch (error: any) {
    console.error('🔍 CLIENT: AI Search network error', error);
    return {
      success: false,
      error: 'Network error during AI search'
    };
  }
}
