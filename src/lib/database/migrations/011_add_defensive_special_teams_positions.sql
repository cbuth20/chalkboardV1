-- Migration: Add defensive and special teams positions to skill_position enum
-- This adds all defensive and special teams positions that were missing

-- Add defensive line positions
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'DE';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'DT';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'NT';

-- Add linebacker positions
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'MLB';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'OLB';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'ILB';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'WILL';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'MIKE';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'SAM';

-- Add secondary positions
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'CB';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'FS';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'SS';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'S';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'NB';

-- Add special teams positions
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'K';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'P';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'LS';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'KR';
ALTER TYPE skill_position ADD VALUE IF NOT EXISTS 'PR';

-- Note: PostgreSQL enum values cannot be removed once added, only new values can be appended.
-- The IF NOT EXISTS clause ensures this migration is idempotent.
