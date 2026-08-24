// ARTE-related Airtable operations
import type { AirtableBehaviour, AirtableSystem, AirtablePurpose, AirtableProvision } from '@/types/index.js';
import { airtableFetch } from '@/functions/server/core/fetch.js';

export async function fetchSystems(ids?: string[]): Promise<AirtableSystem[]> {
    // Determine if a filter formula is needed
    const body = ids && ids.length > 0
        ? JSON.stringify({
            filterByFormula: `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(",")})`,
            fields: [
                "Name",
                "Image URL",
                "Record ID",
                "Behaviours"
            ]
        })
        : JSON.stringify({
            fields: [
                "Name",
                "Image URL",
                "Record ID",
                "Behaviours"
            ]
        });
    
    const response = await airtableFetch("Systems/listRecords", {
        method: 'POST',
        body
    }, 'portal');

    const data = response.data;
    return data.records.map((record: any) => record.fields) as AirtableSystem[];
}

export async function fetchBehaviours(ids?: string[]): Promise<AirtableBehaviour[]> {
    // Determine if a filter formula is needed
    const body = ids && ids.length > 0
        ? JSON.stringify({
            filterByFormula: `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(",")})`,
            fields: [
                "Name",
                "Type",
                "Purpose",
                "Provision",
                "Record ID"
            ]
        })
        : JSON.stringify({
            fields: [
                "Name",
                "Type",
                "Purpose",
                "Provision",
                "Record ID"
            ]
        });

    const response = await airtableFetch("Behaviours/listRecords", {
        method: 'POST',
        body
    }, 'portal');

    const data = response.data;
    return data.records.map((record: any) => record.fields) as AirtableBehaviour[];
}

export async function fetchPurposes(ids?: string[]): Promise<AirtablePurpose[]> {
    // Determine if a filter formula is needed
    const body = ids && ids.length > 0
        ? JSON.stringify({
            filterByFormula: `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(",")})`,
            fields: [
                "Name",
                "Systems",
                "Behaviours",
                "Record ID"
            ]
        })
        : JSON.stringify({
            fields: [
                "Name",
                "Systems",
                "Behaviours",
                "Record ID"
            ]
        });

    const response = await airtableFetch("Purposes/listRecords", {
        method: 'POST',
        body
    }, 'portal');

    const data = response.data;
    return data.records.map((record: any) => record.fields) as AirtablePurpose[];
}

export async function fetchProvisions(ids?: string[]): Promise<AirtableProvision[]> {
    // Determine if a filter formula is needed
    const body = ids && ids.length > 0
        ? JSON.stringify({
            filterByFormula: `OR(${ids.map(id => `RECORD_ID()='${id}'`).join(",")})`,
            fields: [
                "Excerpt",
                "Description",
                "Purpose",
                "Systems",
                "Record ID"
            ]
        })
        : JSON.stringify({
            fields: [
                "Excerpt",
                "Description",
                "Purpose",
                "Systems",
                "Record ID"
            ]
        });

    const response = await airtableFetch("Provisions/listRecords", {
        method: 'POST',
        body
    }, 'portal');

    const data = response.data;
    return data.records.map((record: any) => record.fields) as AirtableProvision[];
}

export async function searchBehaviours(query: string): Promise<AirtableBehaviour[]> {
    console.log("Fetching behaviour matches for...", query)

    try {
        const response = await fetch('/api/resources/search-behaviours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query 
            })
        });

        const { matches } = await response.json();
        console.log("Behaviour matches found:", matches.length)
        return matches;
    } catch (error: any) {
        console.error('Error searching behaviours:', error.message)
        return error;
    }
} 
