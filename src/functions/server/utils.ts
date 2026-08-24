import DOMPurify from "isomorphic-dompurify";
import { marked } from 'marked'
import type { AirtableRecord, CourseResourceSummary, CourseResourceItem, ScheduledDaySummary, ScheduledDayLinks } from '@/types/courses'
marked.setOptions({
    breaks: true,
    gfm: true,
})

export function prettyDate(date: string) {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();

    const suffix = (day: number) => {
        if (day > 3 && day < 21) return 'th';
        switch (day % 10) {
            case 1: return 'st';
            case 2: return 'nd';
            case 3: return 'rd';
            default: return 'th';
        }
    };

    return `${day}${suffix(day)} ${month} ${year}`;
}

export function toHtml(markdown: string) {

    if (!markdown) return ""

    const markdownText = markdown.replace(/\*\*(.*?)\*\*/g, '#### $1')
    const formattedText = markdownText.replace(/\n/g, '\n\n')
    const html = marked.parse(formattedText)
    return DOMPurify.sanitize(html as string)
}

export function richTextToHtml(richText: string) {
    if (!richText) return ""

    const formattedText = richText.replace(/\n/g, '\n\n')
    const html = marked.parse(formattedText)
    return html as string
}

export function getUrlParams(url: string) {
    const params = new URLSearchParams(url);
    return params;
}

export function getAuthToken(cookies: string) {
    return cookies
      .split('; ')
      .find((row) => row.startsWith('authToken='))
      ?.split('=')[1];
}

export function prettyPath(path: string) {
    return path.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toStringArray(value: unknown): string[] {
    if (!value) return []

    if (Array.isArray(value)) {
        return value
            .map((item) => (item == null ? '' : String(item).trim()))
            .filter(Boolean)
    }

    return String(value)
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
}

export function toNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const numeric = parseInt(value, 10)
        return Number.isFinite(numeric) ? numeric : undefined
    }

    if (Array.isArray(value) && value.length > 0) {
        return toNumber(value[0])
    }

    return undefined
}

export function calculateCourseStatus(startDate: string | null | undefined, endDate: string | null | undefined): 'Upcoming' | 'Running' | 'Completed' | '—' {
    // Return em dash if either date is missing
    if (!startDate || !endDate) {
        return '—'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    if (today < start) {
        return 'Upcoming'
    } else if (today >= start && today <= end) {
        return 'Running'
    } else {
        return 'Completed'
    }
}

export function toCourseResourceItems(resources: CourseResourceSummary[]): CourseResourceItem[] {
    return resources.map<CourseResourceItem>((resource) => {
        const courseDay = toNumber(resource['Course Day'])
        const name =
            (resource['Resource Name'] as string | undefined) ||
            (resource['Name'] as string | undefined) ||
            resource.recordId

        const url =
            (resource['Resource URL'] as string | undefined) ||
            (resource['URL'] as string | undefined)
        const icon = resource['Icon'] as string | undefined

        return {
            id: resource.recordId || resource['Record ID'] || name || Math.random().toString(36),
            name,
            url,
            courseDay: courseDay ?? null,
            icon,
            raw: resource
        }
    })
}

export function cherryPickAirtableFields<T extends Record<string, unknown>>(
    record: AirtableRecord,
    allowedFields: ReadonlyArray<string>
): T {
    const sourceFields = record.fields ?? {}
    const trimmed: Record<string, unknown> = {
        recordId: record.id,
    }

    for (const field of allowedFields) {
        if (field in sourceFields) {
            trimmed[field] = sourceFields[field]
        }
    }

    return trimmed as T
}

type SortDirection = 'asc' | 'desc';

type SortKey<T> = keyof T | ((item: T) => unknown);

type SortParser = (value: unknown) => number | string;

const defaultParser: SortParser = (value) => {
    if (value == null) {
        return '';
    }
    return value as string | number;
};

export function sortBy<T>(
    records: T[],
    key: SortKey<T>,
    direction: SortDirection = 'asc',
    parser: SortParser = defaultParser
): T[] {
    const multiplier = direction === 'desc' ? -1 : 1;

    return [...records].sort((a, b) => {
        const rawA = typeof key === 'function' ? key(a) : a[key];
        const rawB = typeof key === 'function' ? key(b) : b[key];

        const parsedA = parser(rawA);
        const parsedB = parser(rawB);

        if (parsedA < parsedB) return -1 * multiplier;
        if (parsedA > parsedB) return 1 * multiplier;
        return 0;
    });
}

export function buildResourceSchedule(
    resources: CourseResourceSummary[],
    dates: string[],
    progressionValue: unknown,
    endDate?: string | null,
    scheduledDays?: ScheduledDaySummary[]
): CourseResourceEntry[] {
    const progressionDay = toNumber(progressionValue)
    const normalizedDates = Array.isArray(dates) ? dates.map((date) => String(date)) : []
    const resourceItems = toCourseResourceItems(resources)

    // Create a Map of dayNumber -> ScheduledDaySummary for quick lookup
    const scheduledDaysByDayNumber = new Map<number, ScheduledDaySummary>()
    if (Array.isArray(scheduledDays)) {
        for (const scheduledDay of scheduledDays) {
            const dayNo = toNumber(scheduledDay['Day No.'])
            if (dayNo != null && dayNo > 0) {
                scheduledDaysByDayNumber.set(dayNo, scheduledDay)
            }
        }
    }

    const itemsByDay = new Map<number, CourseResourceItem[]>()
    const generalItems: CourseResourceItem[] = []

    for (const item of resourceItems) {
        if (item.courseDay != null && item.courseDay > 0) {
            const dayNumber = item.courseDay
            const courseDate =
                dayNumber <= normalizedDates.length
                    ? normalizedDates[dayNumber - 1]
                    : item.courseDate ?? null
            const enrichedItem = { ...item, courseDate }
            if (itemsByDay.has(dayNumber)) {
                itemsByDay.get(dayNumber)!.push(enrichedItem)
            } else {
                itemsByDay.set(dayNumber, [enrichedItem])
            }
        } else {
            // Collect resources without Course Day assignment
            generalItems.push(item)
        }
    }

    const schedule: CourseResourceEntry[] = normalizedDates.map((date, index) => {
        const dayNumber = index + 1
        const items = itemsByDay.get(dayNumber) ?? []
        const visible =
            progressionDay == null || (dayNumber != null && dayNumber <= progressionDay)

        // Look up scheduled day links for this day number
        const scheduledDay = scheduledDaysByDayNumber.get(dayNumber)
        // Fields won't exist in response if blank in Airtable, so check for existence and non-empty
        const zoomLink = scheduledDay?.['Zoom Link'] as string | undefined
        // Access Code is a lookup field, so it might be an array - extract first element if array
        const accessCodeRaw = scheduledDay?.['Access Code'] as string | string[] | undefined
        const accessCode = Array.isArray(accessCodeRaw) ? accessCodeRaw[0] : accessCodeRaw
        const feedbackLink = scheduledDay?.['Feedback Link'] as string | undefined
        // Only create dayLinks if at least one field exists and is not empty
        const hasZoomLink = zoomLink != null && typeof zoomLink === 'string' && zoomLink.trim().length > 0
        const hasAccessCode = accessCode != null && typeof accessCode === 'string' && accessCode.trim().length > 0
        const hasFeedbackLink = feedbackLink != null && typeof feedbackLink === 'string' && feedbackLink.trim().length > 0
        const dayLinks: ScheduledDayLinks | undefined = (hasZoomLink || hasAccessCode || hasFeedbackLink) ? {
            zoomLink: hasZoomLink ? zoomLink.trim() : undefined,
            accessCode: hasAccessCode ? accessCode.trim() : undefined,
            feedbackLink: hasFeedbackLink ? feedbackLink.trim() : undefined,
        } : undefined

        return {
            dayNumber,
            courseDate: date,
            visible,
            items,
            dayLinks,
        }
    }).filter((entry) => {
        // Only include entries that have at least one resource or at least one day link
        const hasItems = entry.items.length > 0
        const hasDayLinks = entry.dayLinks != null && (
            entry.dayLinks.zoomLink != null ||
            entry.dayLinks.accessCode != null ||
            entry.dayLinks.feedbackLink != null
        )
        return hasItems || hasDayLinks
    })

    for (const [dayNumber, items] of itemsByDay.entries()) {
        if (dayNumber > normalizedDates.length) {
            const visible =
                progressionDay == null || (dayNumber != null && dayNumber <= progressionDay)
            
            // Look up scheduled day links for this day number
            const scheduledDay = scheduledDaysByDayNumber.get(dayNumber)
            // Fields won't exist in response if blank in Airtable, so check for existence and non-empty
            const zoomLink = scheduledDay?.['Zoom Link'] as string | undefined
            // Access Code is a lookup field, so it might be an array - extract first element if array
            const accessCodeRaw = scheduledDay?.['Access Code'] as string | string[] | undefined
            const accessCode = Array.isArray(accessCodeRaw) ? accessCodeRaw[0] : accessCodeRaw
            const feedbackLink = scheduledDay?.['Feedback Link'] as string | undefined
            // Only create dayLinks if at least one field exists and is not empty
            const hasZoomLink = zoomLink != null && typeof zoomLink === 'string' && zoomLink.trim().length > 0
            const hasAccessCode = accessCode != null && typeof accessCode === 'string' && accessCode.trim().length > 0
            const hasFeedbackLink = feedbackLink != null && typeof feedbackLink === 'string' && feedbackLink.trim().length > 0
            const dayLinks: ScheduledDayLinks | undefined = (hasZoomLink || hasAccessCode || hasFeedbackLink) ? {
                zoomLink: hasZoomLink ? zoomLink.trim() : undefined,
                accessCode: hasAccessCode ? accessCode.trim() : undefined,
                feedbackLink: hasFeedbackLink ? feedbackLink.trim() : undefined,
            } : undefined

            // Only add entry if it has at least one resource or at least one day link
            const hasItems = items.length > 0
            const hasDayLinks = dayLinks != null && (
                dayLinks.zoomLink != null ||
                dayLinks.accessCode != null ||
                dayLinks.feedbackLink != null
            )
            
            if (hasItems || hasDayLinks) {
                schedule.push({
                    dayNumber,
                    courseDate: items[0]?.courseDate ?? null,
                    visible,
                    items,
                    dayLinks,
                })
            }
        }
    }

    // Add General section if there are general resources AND course is completed
    if (generalItems.length > 0 && endDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const end = new Date(endDate)
        end.setHours(0, 0, 0, 0)

        // General resources only visible on/after end date
        if (today >= end) {
            schedule.push({
                dayNumber: null, // null indicates "General" section
                courseDate: null,
                visible: true,
                items: generalItems,
            })
        }
    }

    return schedule.sort((a, b) => {
        // General entries (null dayNumber) should come last
        if (a.dayNumber === null) return 1
        if (b.dayNumber === null) return -1
        return a.dayNumber - b.dayNumber
    })
}