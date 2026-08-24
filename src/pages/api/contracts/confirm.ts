import type { APIRoute } from 'astro'
import { confirmContract } from '@/functions/server/airtable/courses.ts'
import { createErrorResponse, createSuccessResponse } from '@/functions/server/core/responses.ts'
import { handleApiError } from '@/functions/server/core/errors.ts'
import { logRequest, logResponse, PerformanceTimer } from '@/functions/server/core/logger.ts'

export const POST: APIRoute = async ({ request }) => {
    const timer = new PerformanceTimer('Contract Confirm API')

    try {
        const body = await request.json()
        const { applicationRecordId } = body || {}

        if (!applicationRecordId || typeof applicationRecordId !== 'string') {
            return createErrorResponse('Application record ID is required', 400)
        }

        logRequest('POST', '/api/contracts/confirm', { applicationRecordId })

        const result = await confirmContract(applicationRecordId)

        logResponse('POST', '/api/contracts/confirm', 200, timer.end())
        return createSuccessResponse(result, 'Contract confirmed successfully')
    } catch (error: any) {
        logResponse('POST', '/api/contracts/confirm', error.statusCode || 500, timer.end())
        return handleApiError(error)
    }
}

