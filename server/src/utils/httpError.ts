export interface ErrorDetail {
  field: string
  message: string
}

export class HttpError extends Error {
  status: number
  code: string
  details?: ErrorDetail[]

  constructor(status: number, code: string, message: string, details?: ErrorDetail[]) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message: string, details?: ErrorDetail[]): HttpError {
    return new HttpError(400, 'BAD_REQUEST', message, details)
  }

  static validation(message: string, details?: ErrorDetail[]): HttpError {
    return new HttpError(400, 'VALIDATION_ERROR', message, details)
  }

  static unauthorized(message = 'Authentication required'): HttpError {
    return new HttpError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'Forbidden'): HttpError {
    return new HttpError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Not found'): HttpError {
    return new HttpError(404, 'NOT_FOUND', message)
  }

  static conflict(message: string, details?: ErrorDetail[]): HttpError {
    return new HttpError(409, 'CONFLICT', message, details)
  }

  static payloadTooLarge(message = 'Payload too large'): HttpError {
    return new HttpError(413, 'PAYLOAD_TOO_LARGE', message)
  }

  static unsupportedMedia(message = 'Unsupported media type'): HttpError {
    return new HttpError(415, 'UNSUPPORTED_MEDIA_TYPE', message)
  }

  static internal(message = 'Internal server error'): HttpError {
    return new HttpError(500, 'INTERNAL_ERROR', message)
  }
}
