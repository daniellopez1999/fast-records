-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set default client encoding
SET client_encoding = 'UTF8';

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;

-- Initial tables will be created by TypeORM migrations
-- This file ensures the database and user are properly set up
