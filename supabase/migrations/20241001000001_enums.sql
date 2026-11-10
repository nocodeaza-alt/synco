-- SYNCO Phase 1: Enums
-- Migration: 20241001000001_enums.sql

CREATE TYPE access_role AS ENUM (
  'owner',
  'c_level',
  'team_lead',
  'member'
);

CREATE TYPE member_status AS ENUM (
  'invited',
  'active',
  'removed'
);

CREATE TYPE task_stage AS ENUM (
  'todo',
  'in_progress',
  'in_review',
  'final_review',
  'needs_revision',
  'done'
);

CREATE TYPE priority AS ENUM (
  'high',
  'medium',
  'low'
);

CREATE TYPE task_source AS ENUM (
  'owner',
  'c_level',
  'team_lead',
  'request',
  'priority_request'
);

CREATE TYPE request_status AS ENUM (
  'pending',
  'accepted',
  'declined'
);

CREATE TYPE result_kind AS ENUM (
  'document',
  'link',
  'image'
);

CREATE TYPE presence_status AS ENUM (
  'available',
  'focus',
  'meeting',
  'away'
);

CREATE TYPE review_decision AS ENUM (
  'approved',
  'changes_requested'
);
