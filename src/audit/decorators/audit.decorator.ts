import { SetMetadata } from '@nestjs/common';

export const AUDIT_KEY = 'audit';

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
