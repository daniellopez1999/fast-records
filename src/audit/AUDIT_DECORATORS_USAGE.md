# Audit Decorators Usage Guide

This guide explains how to use the audit decorators for selective endpoint auditing in the NestJS application. The system provides two decorators for different scenarios: authenticated endpoints and public endpoints.

## Overview

The audit system intercepts HTTP requests and logs them to the database. By using decorators, you control which endpoints get audited and which are skipped. This prevents unnecessary logging of non-critical requests and ensures sensitive operations are tracked.

## Protected Endpoints with @Audit()

Use the `@Audit()` decorator for endpoints that require authentication and have an associated user ID. These endpoints will capture the user ID from the JWT token and log all request details.

### Example implementations

```typescript
import { Audit } from './audit/decorators';

@Audit()
@Post('/users')
create(@Body() createUserDto: CreateUserDto): Promise<User> {
  return this.usersService.create(createUserDto);
}

@Audit()
@Patch('/users/:id')
update(
  @Param('id') id: string,
  @Body() updateUserDto: UpdateUserDto,
): Promise<User> {
  return this.usersService.update(id, updateUserDto);
}

@Audit()
@Delete('/users/:id')
delete(@Param('id') id: string): Promise<void> {
  return this.usersService.delete(id);
}
```

### What gets logged

- User ID (captured from JWT token)
- Request method and endpoint URL
- Controller and method name
- Response status code
- Device, browser, and OS information
- Request duration
- Error messages (if applicable)

## Public Endpoints with @AuditPublic()

Use the `@AuditPublic()` decorator for public endpoints that don't require authentication. Since there's no authenticated user yet, the user ID will be null, but the request is still logged for security and analytics purposes.

### When to use @AuditPublic()

- User registration
- Login endpoints
- Password reset requests
- Public information endpoints
- Any endpoint accessible without authentication

### Example implementations

```typescript
import { AuditPublic } from './audit/decorators';

@AuditPublic()
@Post('/auth/register')
register(@Body() createUserDto: CreateUserDto): Promise<{ token: string }> {
  return this.authService.register(createUserDto);
}

@AuditPublic()
@Post('/auth/login')
login(
  @Body() loginDto: LoginDto,
): Promise<{ token: string }> {
  return this.authService.login(loginDto);
}

@AuditPublic()
@Post('/auth/forgot-password')
forgotPassword(
  @Body() { email }: { email: string },
): Promise<{ message: string }> {
  return this.authService.sendPasswordReset(email);
}
```

### What gets logged

- User ID is null (no authentication)
- Request method and endpoint URL
- Controller and method name
- Response status code
- Device, browser, and OS information
- Request duration
- Error messages (if applicable)

## Endpoints without decorator

If an endpoint doesn't have either `@Audit()` or `@AuditPublic()` decorator, it won't be audited. The interceptor will skip it and the request will proceed normally without any logging.

```typescript
// This endpoint will NOT be audited
@Get('/users/:id')
getUser(@Param('id') userId: string): Promise<User> {
  return this.usersService.findOne(userId);
}
```

## Audit log data structure

Each audit log entry contains:

- **id**: Unique identifier for the log entry
- **user_id**: User who made the request (null for public endpoints)
- **controller**: Name of the controller class
- **method**: Name of the controller method
- **status**: STARTED, FINISHED, or FINISHED_WITH_ERROR
- **ip_address**: Client IP address
- **user_agent**: Browser user agent string
- **device**: Device type (desktop, mobile, tablet)
- **version**: Browser version
- **http_method**: HTTP method used (GET, POST, etc.)
- **endpoint**: Request URL path
- **status_code**: HTTP response status code
- **error_message**: Error message if request failed
- **metadata**: Additional information (browser, OS, etc.)
- **duration_ms**: Request processing time in milliseconds
- **created_at**: Timestamp when request started
- **finished_at**: Timestamp when request completed