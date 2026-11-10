-- SYNCO Phase 1: Knowledge Base (Sync Mind)
-- Migration: 20241001000005_knowledge.sql

-- Enable pgvector extension for document embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- kb_documents: approved results that enter the knowledge base
CREATE TABLE kb_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  task_result_id  uuid REFERENCES task_results ON DELETE SET NULL,
  title           text NOT NULL,
  content         text,
  department_id   uuid REFERENCES departments ON DELETE SET NULL,
  goal_id         uuid REFERENCES goals ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kb_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_documents_select" ON kb_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = kb_documents.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "kb_documents_insert" ON kb_documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = kb_documents.workspace_id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'c_level', 'team_lead')
        AND m.status = 'active'
    )
  );


-- kb_chunks: vector embeddings for semantic search
CREATE TABLE kb_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     uuid NOT NULL REFERENCES kb_documents ON DELETE CASCADE,
  chunk_index     int NOT NULL,
  content         text NOT NULL,
  embedding       vector(1536),
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kb_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_chunks_select" ON kb_chunks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM kb_documents doc
      JOIN memberships m ON m.workspace_id = doc.workspace_id
      WHERE doc.id = kb_chunks.document_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

-- Index for fast similarity search
CREATE INDEX kb_chunks_embedding_idx
  ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);


-- kb_compilations: Sync Mind compiled document sets
CREATE TABLE kb_compilations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  query         text NOT NULL,
  document_ids  uuid[] NOT NULL DEFAULT '{}',
  created_by    uuid NOT NULL REFERENCES auth.users,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE kb_compilations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kb_compilations_select" ON kb_compilations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = kb_compilations.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );

CREATE POLICY "kb_compilations_insert" ON kb_compilations
  FOR INSERT WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.workspace_id = kb_compilations.workspace_id
        AND m.user_id = auth.uid()
        AND m.status = 'active'
    )
  );
