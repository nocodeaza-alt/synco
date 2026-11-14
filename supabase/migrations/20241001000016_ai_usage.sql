-- AI token usage tracking per workspace per month
-- Used for financial model: cost = tokens × per-token price

CREATE TABLE IF NOT EXISTS ai_usage (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    uuid NOT NULL REFERENCES workspaces ON DELETE CASCADE,
  feature         text NOT NULL,          -- 'decompose' | 'syncmind'
  model           text NOT NULL,          -- e.g. 'claude-haiku-5-5'
  input_tokens    int  NOT NULL DEFAULT 0,
  output_tokens   int  NOT NULL DEFAULT 0,
  -- Cost in USD micro-cents (multiply by 0.00001 to get dollars)
  cost_microcents bigint NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ai_usage_workspace_created
  ON ai_usage (workspace_id, created_at);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Only owners/c_level can read usage data
CREATE POLICY "ai_usage_select" ON ai_usage
  FOR SELECT USING (
    workspace_id = ANY(SELECT user_workspace_ids(auth.uid()))
    AND (SELECT role FROM memberships WHERE user_id = auth.uid() AND status = 'active' LIMIT 1)
      IN ('owner', 'c_level')
  );

-- Only service role can insert (via API route)
-- No INSERT policy needed — service role bypasses RLS

-- Monthly summary view (for financial dashboard)
CREATE OR REPLACE VIEW ai_usage_monthly AS
SELECT
  workspace_id,
  feature,
  model,
  date_trunc('month', created_at) AS month,
  SUM(input_tokens)                AS total_input_tokens,
  SUM(output_tokens)               AS total_output_tokens,
  SUM(input_tokens + output_tokens) AS total_tokens,
  SUM(cost_microcents)              AS total_cost_microcents,
  ROUND(SUM(cost_microcents) / 100000.0, 4) AS total_cost_usd,
  COUNT(*)                          AS api_calls
FROM ai_usage
GROUP BY workspace_id, feature, model, date_trunc('month', created_at);
