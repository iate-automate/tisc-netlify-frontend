// Course-related Airtable operations
import { airtableApiBase, airtableBaseId } from '@/config/settings.js';
import { airtableFetch } from '@/functions/server/core/fetch'

// Helper function to construct Airtable URLs with proper normalization
function buildAirtableUrl(endpoint: string): string {
    const apiBase = airtableApiBase();
    const baseId = airtableBaseId('main');
    return `${apiBase}/${baseId}/${endpoint}`;
}

export async function fetchBookings(id: string) {
    try {
        const response = await fetch(buildAirtableUrl('Bookings/listRecords'), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
            },
            body: JSON.stringify({
                'fields': [
                    'Booking ID',
                    'Line Item IDs',
                    'Line Item Descriptions',
                    'Start Dates',
                    'Line Item Unit Costs',
                    'Seat Totals',
                    'Booking Total',
                    'Name',
                    'Organisation'
                ],
                'filterByFormula': '{Booking ID} = "' + id + '"'
            })
        });
        const data = await response.json();

        // Return selected record only if ID is provided
        if (id) {
            return data.records[0].fields;
        } else {
            return data.records;
        }
    } catch (error) {
        return error;
    }
}

export async function fetchCourseDays(id: string) {
    try {
        const response = await fetch(buildAirtableUrl('Scheduled%20Days/listRecords'), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
            },
            body: JSON.stringify({
                "fields": [
                    "Start Date",
                    "Day No.",
                    "Date",
                    "Course Title",
                    "Course Record ID",
                ],
                'filterByFormula': '{Course Record ID} = "' + id + '"'
            })
        });
        const data = await response.json();
        const days = data.records.map((record: any) => record.fields);
        const sortedDays = days.sort((a: any, b: any) => a["Day No."] - b["Day No."])
        return sortedDays;
    } catch (error) {
        return error;
    }
}

export async function fetchRegisters(id: string) {
    try {
        const response = await fetch(buildAirtableUrl('Registers/listRecords'), {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
            },
            body: JSON.stringify({
                "fields": [
                    "Register ID",
                    "Register Record ID",
                    "Course Record ID",
                    "Feed Name",
                    "1",
                    "2",
                    "3",
                    "4",
                    "5",
                    "6",
                    "7",
                    "8",
                    "9",
                    "10",
                    "11"
                ],
                'filterByFormula': '{Course Record ID} = "' + id + '"'
            })
        });
        const data = await response.json();
        const registers = data.records.map((record: any) => record.fields);
        return registers;
    } catch (error) {
        return error;
    }
}

export async function updateRegisters(registers: any) {
    try {
        const response = await fetch('/api/courses/registers', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                registers: JSON.stringify(registers)
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return error;
    }
}

export async function confirmContract(applicationRecordId: string) {
    if (!applicationRecordId) {
        throw new Error('Application record ID is required to confirm contract.')
    }

    try {
        const response = await airtableFetch(
            `Applications/${applicationRecordId}`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    fields: {
                        "Contract Signed": true,
                        "Contract Signed At": new Date().toISOString()
                    }
                })
            }
        )

        return response.data
    } catch (error) {
        console.error('Error confirming contract:', error)
        throw error
    }
}

export async function fetchApplications(id: string, mode?: boolean) {
    try {
        const apiUrl = buildAirtableUrl('Applications/listRecords');
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
            },
            body: JSON.stringify({
                'fields': [
                    'Application ID',
                    'Full Name',
                    'Email',
                    'Phone',
                    'Feed Organisation',
                    'Role',
                    'Feed Trauma Record ID',
                    'Form Responses',
                    'Course Title',
                    'Course ID',
                    'Start Date'
                ],
                'filterByFormula': '{Course Record ID} = "' + id + '"'
            })
        });
        const data = await response.json();
        const res = data.records.map((record: any) => record.fields);

        // If Mode is true fetch Trauma Records and append to the application records
        if (mode) {
            for (const record of res) {
                if (!record['Feed Trauma Record ID']) continue;
                const traumaUrl = buildAirtableUrl('Trauma%20Records/listRecords');
                const response = await fetch(traumaUrl, {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
                    },
                    body: JSON.stringify({
                        'fields': [
                            'Trauma Record ID',
                            'Statement'
                        ],
                        'filterByFormula': '{Trauma Record ID} = "' + record['Feed Trauma Record ID'] + '"'
                    })
                });
                const data = await response.json();
                record['Trauma Record'] = data.records[0].fields['Statement'];
            }
        }
        return res;

    } catch (error) {
        return error;
    }
}

export async function fetchApplication(recordId: string) {
    try {
        const response = await fetch(buildAirtableUrl(`Applications/${recordId}`), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch application: ' + response.statusText);
        }

        const data = await response.json();
        return data.fields;
    } catch (error) {
        console.error('Error fetching application:', error);
        return error;
    }
}

export async function fetchResource(recordId: string) {
    try {
        const response = await fetch(buildAirtableUrl(`Resources/${recordId}`), {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + import.meta.env.AIRTABLE_API_KEY
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch resource: ' + response.statusText);
        }

        const data = await response.json();
        return data.fields;
    } catch (error) {
        console.error('Error fetching resource:', error);
        return error;
    }
}