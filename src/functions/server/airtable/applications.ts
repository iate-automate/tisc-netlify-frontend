import { airtableFetch } from '@/functions/server/core/fetch';
import { logger } from '@/functions/server/core/logger';
import {
  buildResourceSchedule,
  cherryPickAirtableFields,
} from '@/functions/server/utils';
import {
  AIRTABLE_APPLICATION_FIELDS,
  AIRTABLE_RESOURCE_FIELDS,
  AIRTABLE_SCHEDULED_COURSE_FIELDS,
  AIRTABLE_SCHEDULED_DAY_FIELDS,
} from '@/functions/constants';
import type {
  AirtableRecord,
  ApplicationSummary,
  CourseDetailsData,
  CourseResourceItem,
  CourseResourceSummary,
  ScheduledCourseSummary,
  ScheduledDaySummary,
} from '@/types/courses';

/**
 * Fetch application records directly by their Airtable record IDs.
 * Returns only applications with a confirmed status.
 */
export async function fetchApplicationsByRecordIds(recordIds: string[] = []): Promise<ApplicationSummary[]> {
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    recordIds.map((recordId) =>
      airtableFetch<AirtableRecord>(`Applications/${recordId}`, {
        method: 'GET',
        timeout: 4000,
      })
    )
  );

  const applications: ApplicationSummary[] = [];

  for (const [index, result] of results.entries()) {
    const recordId = recordIds[index];

    if (result.status !== 'fulfilled') {
      logger.warn('Failed to fetch application record', { recordId, error: result.reason?.message });
      continue;
    }

    const data = result.value.data;

    if (!data?.fields) {
      logger.warn('Application record missing fields', { recordId });
      continue;
    }

    const trimmedRecord = cherryPickAirtableFields<ApplicationSummary>(data, AIRTABLE_APPLICATION_FIELDS);
    const statusField = trimmedRecord['Status'];
    const status = Array.isArray(statusField) ? statusField[0] : statusField;

    if (status !== 'Confirmed') {
      continue;
    }

    applications.push(trimmedRecord);
  }

  return applications;
}

export async function fetchScheduledCourse(recordId: string): Promise<ScheduledCourseSummary | null> {
  if (!recordId) {
    return null;
  }

  try {
    const response = await airtableFetch<AirtableRecord>(`Scheduled%20Courses/${recordId}`, {
      method: 'GET',
      timeout: 4000,
    });

    const data = response.data;

    if (!data?.fields) {
      logger.warn('Scheduled course record missing fields', { recordId });
      return null;
    }

    return cherryPickAirtableFields<ScheduledCourseSummary>(data, AIRTABLE_SCHEDULED_COURSE_FIELDS);
  } catch (error: any) {
    logger.warn('Failed to fetch scheduled course record', { recordId, error: error?.message });
    return null;
  }
}

export async function fetchCourseResources(resourceIds: string[] = []): Promise<CourseResourceSummary[]> {
  if (!Array.isArray(resourceIds) || resourceIds.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    resourceIds.map((recordId) =>
      airtableFetch<AirtableRecord>(`Resources/${recordId}`, {
        method: 'GET',
        timeout: 4000,
      })
    )
  );

  const resources: CourseResourceSummary[] = [];

  for (const [index, result] of results.entries()) {
    const recordId = resourceIds[index];

    if (result.status !== 'fulfilled') {
      logger.warn('Failed to fetch resource record', { recordId, error: result.reason?.message });
      continue;
    }

    const data = result.value.data;

    if (!data?.fields) {
      logger.warn('Resource record missing fields', { recordId });
      continue;
    }

    resources.push(
      cherryPickAirtableFields<CourseResourceSummary>(data, AIRTABLE_RESOURCE_FIELDS)
    );
  }

  return resources;
}

export async function fetchScheduledDays(recordIds: string[] = []): Promise<ScheduledDaySummary[]> {
  if (!Array.isArray(recordIds) || recordIds.length === 0) {
    return [];
  }

  const results = await Promise.allSettled(
    recordIds.map((recordId) =>
      airtableFetch<AirtableRecord>(`Scheduled%20Days/${recordId}`, {
        method: 'GET',
        timeout: 4000,
      })
    )
  );

  const scheduledDays: ScheduledDaySummary[] = [];

  for (const [index, result] of results.entries()) {
    const recordId = recordIds[index];

    if (result.status !== 'fulfilled') {
      logger.warn('Failed to fetch scheduled day record', { recordId, error: result.reason?.message });
      continue;
    }

    const data = result.value.data;

    if (!data?.fields) {
      logger.warn('Scheduled day record missing fields', { recordId });
      continue;
    }

    scheduledDays.push(
      cherryPickAirtableFields<ScheduledDaySummary>(data, AIRTABLE_SCHEDULED_DAY_FIELDS)
    );
  }

  return scheduledDays;
}

export async function fetchFullCourseDetails(recordId: string): Promise<CourseDetailsData | null> {
  if (!recordId) {
    return null;
  }

  const [application] = await fetchApplicationsByRecordIds([recordId]);
  if (!application) {
    return null;
  }

  const courseRecordId = (application['Course Record ID'] as string | undefined) ?? undefined;
  const scheduledCourse = courseRecordId ? await fetchScheduledCourse(courseRecordId) : null;

  const rawResourceIds = scheduledCourse?.['Resources'] as string[] | undefined;
  const resourceIds = Array.isArray(rawResourceIds)
    ? rawResourceIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];

  const resourceSummaries = resourceIds.length > 0 ? await fetchCourseResources(resourceIds) : [];
  const courseDatesRaw = scheduledCourse?.['Dates'];
  const courseDates = Array.isArray(courseDatesRaw)
    ? (courseDatesRaw as string[])
    : courseDatesRaw
    ? [courseDatesRaw as string]
    : [];
  const progression = scheduledCourse?.['Resources Days'];
  const endDate = application['End Date'] as string | undefined;

  const rawScheduledDayIds = scheduledCourse?.['Scheduled Days'] as string[] | undefined;
  const scheduledDayIds = Array.isArray(rawScheduledDayIds)
    ? rawScheduledDayIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
    : [];
  const scheduledDays = scheduledDayIds.length > 0 ? await fetchScheduledDays(scheduledDayIds) : [];

  const enrichedResources = buildResourceSchedule(resourceSummaries, courseDates, progression, endDate, scheduledDays);

  return {
    application,
    scheduledCourse,
    resources: enrichedResources,
  };
}

