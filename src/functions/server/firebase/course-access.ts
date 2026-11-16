/**
 * Course-scoped authorisation for applications / registers / trauma.
 *
 * Login gate stays in middleware (Portal Active). This layer answers:
 * may this signed-in person see or mutate a specific Scheduled Course?
 *
 * Allow when:
 * 1. People."Portal Admin" is checked, or
 * 2. People.Trainer is in that course's "Trainer Record IDs" rollup
 */
import { airtableFetch } from '@/functions/server/core/fetch.js';
import { logger } from '@/functions/server/core/logger.js';
import { getAuthData } from './ssr.js';
import type { AuthState, ProtectedRouteResult, UserData } from '@/types/index.js';

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

/**
 * Pure check against already-loaded user data + course trainer allowlist.
 */
export function userCanAccessCourse(
  userData: UserData | null | undefined,
  trainerRecordIds: string[]
): boolean {
  if (!userData?.isActive) return false;
  if (userData.isPortalAdmin) return true;
  if (!userData.trainerRecordId) return false;
  return trainerRecordIds.includes(userData.trainerRecordId);
}

/**
 * Load Scheduled Course trainer allowlist (Trainer Record IDs rollup).
 */
export async function fetchCourseTrainerRecordIds(courseId: string): Promise<string[]> {
  if (!courseId) return [];

  const response = await airtableFetch<{
    id: string;
    fields?: { 'Trainer Record IDs'?: string[] };
  }>(`Scheduled%20Courses/${courseId}`, {
    method: 'GET',
    timeout: 4000,
  });

  return asIdList(response.data?.fields?.['Trainer Record IDs']);
}

export async function canAccessCourse(
  userData: UserData | null | undefined,
  courseId: string
): Promise<boolean> {
  if (!userData?.isActive) return false;
  if (userData.isPortalAdmin) return true;
  if (!courseId || !userData.trainerRecordId) return false;

  try {
    const trainerRecordIds = await fetchCourseTrainerRecordIds(courseId);
    return userCanAccessCourse(userData, trainerRecordIds);
  } catch (error: any) {
    logger.error('Course access lookup failed', {
      courseId,
      peopleId: userData.recordId,
      error: error.message,
    });
    return false;
  }
}

/**
 * Prefer this on Astro pages: pass auth already loaded by middleware (locals.auth)
 * so we do not re-verify the session / re-fetch People.
 */
export async function assertCourseAccess(
  authData: AuthState | null | undefined,
  courseId: string,
  deniedRedirect = '/applications'
): Promise<ProtectedRouteResult> {
  if (!authData?.isAuthenticated || !authData.userData?.isActive) {
    return {
      allowed: false,
      redirect: '/account/signin',
      reason: 'Authentication required',
      authData: authData || { user: null, userData: null, isAuthenticated: false },
    };
  }

  const allowed = await canAccessCourse(authData.userData, courseId);

  if (!allowed) {
    logger.warn('Course access denied', {
      courseId,
      peopleId: authData.userData.recordId,
      isPortalAdmin: authData.userData.isPortalAdmin,
      trainerRecordId: authData.userData.trainerRecordId,
    });
    return {
      allowed: false,
      redirect: deniedRedirect,
      reason: 'Not authorised for this course',
      authData,
    };
  }

  return {
    allowed: true,
    authData,
  };
}

/**
 * For API routes (or callers without middleware locals): one session load + course check.
 */
export async function requireCourseAccess(
  request: Request,
  courseId: string,
  deniedRedirect = '/applications'
): Promise<ProtectedRouteResult> {
  const authData = await getAuthData(request);
  return assertCourseAccess(authData, courseId, deniedRedirect);
}
