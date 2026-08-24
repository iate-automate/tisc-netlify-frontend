// Course Types
export interface Course {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  type: 'in-person' | 'online' | 'hybrid';
  capacity: number;
  enrolled: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  trainerId: string;
  trainerName: string;
  price?: number;
  currency?: string;
}

// Airtable Course Types
export interface AirtableCourseDay {
  // Some Airtable exports use snake_case; others keep spaces. Support both where used.
  Day_No?: number;
  "Day No."?: number;
  Date: string;
  "Course Title"?: string;
  Course_Title?: string;
  Course_Record_ID?: string;
}

export interface AirtableRegister {
  Register_ID: string;
  Register_Record_ID: string;
  Course_Record_ID: string;
  Feed_Name: string;
  [key: string]: any; // For day numbers 1-11
}

// Register Types
export interface AttendanceRegister {
  id: string;
  courseId: string;
  courseTitle: string;
  date: string;
  attendees: RegisterAttendee[];
  trainerId: string;
  trainerName: string;
  status: 'draft' | 'submitted' | 'approved';
  createdAt: string;
  updatedAt: string;
}

export interface RegisterAttendee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  attended: boolean;
  notes?: string;
}

// Attendance Register Types
export type AttendanceStatus = 'E' | 'A' | 'P' | 'X';

export interface AttendanceStatuses {
  [registerId: string]: AttendanceStatus;
}

export interface AttendanceRegisterProps {
  courseId: string;
  days: AirtableCourseDay[];
  registers: AirtableRegister[];
}

export interface RegisterPayload {
  id: string;
  day: string;
  status: AttendanceStatus;
}

export interface RegisterUpdateData {
  courseId: string;
  courseDay: number;
  registers: RegisterPayload[];
  notes: string;
}

// Generic Airtable records used by course resources
export interface AirtableRecord<TFields = Record<string, any>> {
  id: string;
  fields: TFields;
}

export interface ApplicationSummary extends Record<string, unknown> {
  recordId: string;
  'Course Title'?: string;
  'Course Name'?: string;
  'Course ID'?: string;
  'Course Record ID'?: string;
  'Qualification'?: string;
  'Start Date'?: string;
  'End Date'?: string;
  'Course Days'?: number | string;
  'Contract Signed'?: boolean;
  'Contract Signed Date'?: string;
  'Grade'?: string;
  'Certificate URL'?: string;
}

export interface ScheduledCourseSummary extends Record<string, unknown> {
  recordId: string;
  'Course Title'?: string;
  'Course Name'?: string;
  'Course Type'?: string;
  'Qualification'?: string;
  'Dates'?: string[] | string;
  'Access Code'?: string;
  'Venues'?: string[] | string;
  'Trainers'?: string[] | string;
  'Resources'?: string[];
  'Resources Days'?: number | string;
  'Scheduled Days'?: string[];
}

export interface ScheduledDaySummary extends Record<string, unknown> {
  recordId: string;
  'Day No.'?: number;
  'Zoom Link'?: string;
  'Access Code'?: string;
  'Feedback Link'?: string;
}

export interface ScheduledDayLinks {
  zoomLink?: string;
  accessCode?: string;
  feedbackLink?: string;
}

export interface CourseResourceSummary extends Record<string, unknown> {
  recordId: string;
  'Name'?: string;
  'Description'?: string;
  'Resource URL'?: string;
  'Course Day'?: number | string;
  'Icon'?: string;
}

export interface CourseResourceItem {
  id: string;
  name?: string;
  url?: string;
  courseDay: number | null;
  courseDate?: string | null;
  icon?: string;
  raw?: Record<string, any>;
}

export interface CourseResourceEntry {
  dayNumber: number | null; // null indicates "General" section
  courseDate: string | null;
  visible: boolean;
  items: CourseResourceItem[];
  dayLinks?: ScheduledDayLinks;
}

export interface CourseDetailsData {
  application: ApplicationSummary;
  scheduledCourse: ScheduledCourseSummary | null;
  resources: CourseResourceEntry[];
}