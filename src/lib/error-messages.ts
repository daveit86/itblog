// Standardized error messages for consistent UX

export const ErrorMessages = {
  // Authentication errors
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  
  // Validation errors
  REQUIRED_FIELD: (field: string) => `${field} is required.`,
  INVALID_EMAIL: 'Please enter a valid email address.',
  PASSWORD_TOO_SHORT: 'Password must be at least 6 characters long.',
  PASSWORDS_DONT_MATCH: 'Passwords do not match.',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: (minutes: number) => 
    `Rate limit exceeded. Please wait ${minutes} minute${minutes > 1 ? 's' : ''} before trying again.`,
  
  // Resource errors
  NOT_FOUND: (resource: string) => `${resource} not found.`,
  ALREADY_EXISTS: (resource: string) => `${resource} already exists.`,
  
  // Operation errors
  CREATE_FAILED: (resource: string) => `Failed to create ${resource}. Please try again.`,
  UPDATE_FAILED: (resource: string) => `Failed to update ${resource}. Please try again.`,
  DELETE_FAILED: (resource: string) => `Failed to delete ${resource}. Please try again.`,
  FETCH_FAILED: (resource: string) => `Failed to load ${resource}. Please try again.`,
  
  // Generic errors
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
} as const

// Error codes for programmatic handling
export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

// Helper function to get user-friendly error message
export function getErrorMessage(error: unknown, fallback?: string): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return fallback || ErrorMessages.UNKNOWN_ERROR
}
