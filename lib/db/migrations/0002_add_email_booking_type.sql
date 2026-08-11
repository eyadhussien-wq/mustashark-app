-- Add email as a first-class consultation channel.
-- Safe to re-run on PostgreSQL versions that support ADD VALUE IF NOT EXISTS.
ALTER TYPE booking_type ADD VALUE IF NOT EXISTS 'email';
