-- SYNCO Phase 5: Sync Mind enhancements
-- Migration: 20241001000011_phase5.sql

-- Add source_type and full-text search to kb_documents
ALTER TABLE kb_documents
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'task_result',
  ADD COLUMN IF NOT EXISTS file_url    text,
  ADD COLUMN IF NOT EXISTS file_name   text,
  ADD COLUMN IF NOT EXISTS fts         tsvector
    GENERATED ALWAYS AS (
      to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,''))
    ) STORED;

CREATE INDEX IF NOT EXISTS kb_documents_fts_idx ON kb_documents USING gin(fts);

-- Add summary and grouping to kb_compilations
ALTER TABLE kb_compilations
  ADD COLUMN IF NOT EXISTS summary   text,
  ADD COLUMN IF NOT EXISTS grouping  jsonb DEFAULT '[]';

-- Add drive_file_id to task_results so we know when it's saved to Drive
ALTER TABLE task_results
  ADD COLUMN IF NOT EXISTS drive_file_id text,
  ADD COLUMN IF NOT EXISTS drive_file_url text;

-- RLS: allow service role to insert kb_documents (for auto-indexing)
CREATE POLICY "kb_documents_service_insert" ON kb_documents
  FOR INSERT WITH CHECK (true);

CREATE POLICY "kb_compilations_service_insert" ON kb_compilations
  FOR INSERT WITH CHECK (true);
