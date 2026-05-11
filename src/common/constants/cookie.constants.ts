import { CookieOptions } from 'express';
import ms, { StringValue } from 'ms';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: ms((process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d') as StringValue),
  path: '/auth',
};

export const ACCESS_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: ms((process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m') as StringValue),
  path: '/',
};
