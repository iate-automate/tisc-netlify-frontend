/**
 * Client-side course functions
 * These functions call the API endpoints for course-related operations
 */

export interface RegisterUpdateData {
  courseId: string;
  courseDay: number;
  registers: RegisterPayload[];
  notes: string;
}

export interface RegisterPayload {
  id: string;
  day: string;
  status: 'E' | 'A' | 'P' | 'X';
}

export interface CourseResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Update attendance registers
 */
export async function updateRegisters(registers: RegisterUpdateData): Promise<CourseResponse> {
  try {
    console.log('📊 CLIENT: Updating registers...', { courseId: registers.courseId });
    
    const response = await fetch('/api/courses/registers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registers: JSON.stringify(registers)
      })
    });

    console.log('📊 CLIENT: Update response received', { status: response.status, ok: response.ok });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('📊 CLIENT: Update failed', errorData.error);
      return {
        success: false,
        error: errorData.error || 'Failed to update registers'
      };
    }

    const data = await response.json();
    console.log('📊 CLIENT: Update successful', data);

    return {
      success: true,
      data: data.data,
      message: data.message || 'Registers updated successfully'
    };

  } catch (error: any) {
    console.error('📊 CLIENT: Update network error', error);
    return {
      success: false,
      error: 'Network error updating registers'
    };
  }
}
