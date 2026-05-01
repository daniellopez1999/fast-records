import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';
export const AUDIT_PUBLIC_KEY = 'audit_public';

/**
 * Decorator to mark which endpoints should be audited
 * Applied at controller or individual method level
 *
 * @example
 * @Audit()
 * @Post('/users')
 * create(@Body() createUserDto: CreateUserDto) {
 *   // This endpoint will be audited
 * }
 */
export const Audit = () => SetMetadata(AUDIT_KEY, true);

/**
 * Decorator to mark which public endpoints (without authentication) should be audited
 * Applied at controller or individual method level for public endpoints like register, login
 *
 * @example
 * @AuditPublic()
 * @Post('/auth/register')
 * register(@Body() createUserDto: CreateUserDto) {
 *   // This public endpoint will be audited without user_id
 * }
 */
export const AuditPublic = () => SetMetadata(AUDIT_PUBLIC_KEY, true);
