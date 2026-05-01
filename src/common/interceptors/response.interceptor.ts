import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Result } from '@common/interfaces/interfaces';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Check if data is a Result object (from ResponseBuilder.success or ResponseBuilder.failed)
        if (this.isResult(data)) {
          // Apply the statusCode from the Result to the HTTP response
          response.status(data.statusCode);
        }
        return data;
      }),
    );
  }

  /**
   * Checks if the data object is a Result type
   * Result objects have: statusCode, message, data, success
   */
  private isResult(data: any): data is Result<any> {
    return (
      data &&
      typeof data === 'object' &&
      'statusCode' in data &&
      'message' in data &&
      'data' in data &&
      'success' in data &&
      typeof data.statusCode === 'number' &&
      typeof data.message === 'string' &&
      typeof data.success === 'boolean'
    );
  }
}
