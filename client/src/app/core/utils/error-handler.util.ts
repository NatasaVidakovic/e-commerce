/**
 * Utility for extracting user-friendly error messages from HTTP error responses
 */
export class ErrorHandler {
  private static tryParseJson(value: unknown): any {
    if (typeof value !== 'string') return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Extracts error message from various error response formats
   * Handles ASP.NET Core validation errors, problem details, and custom error messages
   */
  static extractErrorMessage(error: any, defaultMessage: string = 'An error occurred'): string {
    if (!error) {
      return defaultMessage;
    }

    // Sometimes callers pass a JSON string.
    const parsedTopLevel = this.tryParseJson(error);
    if (parsedTopLevel !== error) {
      error = parsedTopLevel;
    }

    // Global error interceptor may throw an array of validation messages (e.g. ["Name must be ..."]).
    if (Array.isArray(error)) {
      const flattened = error.flat().filter((x: any) => typeof x === 'string' && x.trim().length > 0);
      if (flattened.length > 0) {
        return flattened.join('; ');
      }
    }

    // Some code paths might throw a ProblemDetails-like object directly.
    if (error?.errors && typeof error.errors === 'object') {
      const validationErrors = this.extractValidationErrors(error.errors);
      if (validationErrors.length > 0) {
        return validationErrors.join('; ');
      }
    }

    // Check for error.error object (HttpErrorResponse)
    if (error.error) {
      const parsedPayload = this.tryParseJson(error.error);

      // Sometimes HttpErrorResponse.error itself is an array of validation messages.
      if (Array.isArray(parsedPayload)) {
        const flattened = parsedPayload.flat().filter((x: any) => typeof x === 'string' && x.trim().length > 0);
        if (flattened.length > 0) {
          return flattened.join('; ');
        }
      }

      // ASP.NET Core validation errors format: { errors: { "FieldName": ["Error message"] } }
      if (parsedPayload?.errors && typeof parsedPayload.errors === 'object') {
        const validationErrors = this.extractValidationErrors(parsedPayload.errors);
        if (validationErrors.length > 0) {
          return validationErrors.join('; ');
        }
      }

      // ASP.NET Core problem details format: { title: "...", detail: "..." }
      if (parsedPayload?.title && typeof parsedPayload.title === 'string') {
        // If there's a detail field, prefer it over title
        if (parsedPayload.detail && typeof parsedPayload.detail === 'string') {
          return parsedPayload.detail;
        }
        return parsedPayload.title;
      }

      // Custom error message format: { message: "..." }
      if (parsedPayload?.message && typeof parsedPayload.message === 'string') {
        return parsedPayload.message;
      }

      // Plain string error
      if (typeof parsedPayload === 'string') {
        return parsedPayload;
      }
    }

    // Fallback to error.message
    if (error.message && typeof error.message === 'string') {
      return error.message;
    }

    return defaultMessage;
  }

  /**
   * Extracts validation error messages from ASP.NET Core errors object
   * @param errors Object with field names as keys and error message arrays as values
   * @returns Array of formatted error messages
   */
  private static extractValidationErrors(errors: any): string[] {
    const errorMessages: string[] = [];

    if (typeof errors === 'object') {
      Object.keys(errors).forEach(fieldName => {
        const fieldErrors = errors[fieldName];
        
        if (Array.isArray(fieldErrors)) {
          // Add each error message for this field
          fieldErrors.forEach((msg: string) => {
            errorMessages.push(msg);
          });
        } else if (typeof fieldErrors === 'string') {
          errorMessages.push(fieldErrors);
        }
      });
    }

    return errorMessages;
  }
}
