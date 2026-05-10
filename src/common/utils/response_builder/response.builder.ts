import { Result } from '@common/interfaces/interfaces';

export class ResponseBuilder {
  /**
   * Builds a successful response with the provided message and optional data.
   * @param message
   * @param data
   * @param statusCode
   * @returns
   */
  static success<T>(
    message: string,
    data: T = null,
    statusCode: number,
  ): Result<T> {
    return {
      statusCode,
      message: message,
      data: data,
      success: true,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Builds a failure response with the provided message, status code, and optional data.
   * @param message
   * @param statusCode
   * @param data
   * @returns
   */
  static failed<T = null>(
    message: string,
    statusCode: number = 500,
  ): Result<T> {
    return {
      statusCode: statusCode,
      message: message,
      data: null,
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}
