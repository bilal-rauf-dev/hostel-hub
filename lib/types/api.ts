/**
 * Every endpoint in this API answers with the same envelope.
 * See docs/03-backend-standards.md.
 */
export interface ApiResponse<T> {
  success: boolean
  data: T
  message: string
}

/** ISO-8601 timestamp string as serialised by FastAPI. */
export type Timestamp = string

export type UserRole = 'student' | 'admin'
