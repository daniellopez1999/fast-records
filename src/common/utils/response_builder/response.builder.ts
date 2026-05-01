export class ResponseBuilder {
  /**
   * Builds a successful response with the provided message and optional data.
   * @param message 
   * @param data 
   * @param statusCode 
   * @returns 
   */
  private static successBuild(message: string, data: any = null, statusCode: number = 200) {
    return {
      statusCode,
      message: message,
      data: data,
      success: true,
    }
  }

  /**
   * Builds a failure response with the provided message, status code, and optional data.
   * @param message 
   * @param statusCode 
   * @param data 
   * @returns 
   */
  private static failBuild<T>(message: string, statusCode: number = 500, data?: T) {
    return {
      statusCode: statusCode,
      message: message,
      data: data,
      success: false,
    }
  }

  /**
   * Method called Service to build the response object based on the success parameter.
   * @param message 
   * @param data 
   * @param success 
   * @param statusCode 
   * @returns 
   */
  static build<T>(message: string, data: T, success: boolean, statusCode: number) {
    switch (success) {
      case true:
        return this.successBuild(message, data, statusCode);
      case false:
        return this.failBuild(message, statusCode, data);
    }
  }
}