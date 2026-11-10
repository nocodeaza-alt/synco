-- Update kb_chunks to use 1024-dim vectors (Voyage AI voyage-3)
ALTER TABLE kb_chunks DROP COLUMN IF EXISTS embedding;
ALTER TABLE kb_chunks ADD COLUMN embedding vector(1024);

-- Drop old index if exists, create new one
DROP INDEX IF EXISTS kb_chunks_embedding_idx;
CREATE INDEX kb_chunks_embedding_idx
  ON kb_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- RPC: semantic search over kb_chunks joined to kb_documents
CREATE OR REPLACE FUNCTION search_kb_semantic(
  p_workspace_id uuid,
  p_embedding    vector(1024),
  p_limit        int DEFAULT 10,
  p_threshold    float DEFAULT 0.5
)
RETURNS TABLE (
  document_id  uuid,
  title        text,
  content      text,
  source_type  text,
  department_id uuid,
  goal_id      uuid,
  created_at   timestamptz,
  metadata     jsonb,
  similarity   float
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT
    d.id              AS document_id,
    d.title,
    c.content,
    d.source_type,
    d.department_id,
    d.goal_id,
    d.created_at,
    d.metadata,
    1 - (c.embedding <=> p_embedding) AS similarity
  FROM kb_chunks c
  JOIN kb_documents d ON d.id = c.document_id
  WHERE d.workspace_id = p_workspace_id
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> p_embedding) >= p_threshold
  ORDER BY c.embedding <=> p_embedding
  LIMIT p_limit;
$$;
