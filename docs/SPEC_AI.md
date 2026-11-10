# SYNCO — AI features (Claude API, server-side only)

Model: use the current Claude Sonnet model for decomposition and compilation. Always request **JSON only** and validate it with zod; retry once on a parse failure. Never send API keys to the client. Log the inputs and outputs to `goals.ai_decomposition` / `kb_compilations`.

## 1. Goal decomposition
**Input context** (built server-side):
```json
{
  "goal": "Launch new product by September 1",
  "due_date": "2026-09-01",
  "company": {"name": "REGAGRO", "size": "11-50"},
  "departments": [
    {"id": "…", "name": "Marketing", "lead": "Jane Smith", "members": [{"id":"…","name":"Tom Reyes","position":"Designer","open_load":4,"capacity":6,"efficiency":88}]}
  ],
  "existing_open_tasks": [{"title":"…","department":"Marketing"}]
}
```
**System prompt:**
> You are SYNCO's planning assistant. Break the company goal into concrete, verifiable tasks. Assign each task to exactly one existing department, based on what that department does. Each task must produce something tangible: a document, link or image. Prefer 2–5 tasks per department that is relevant, and skip departments that aren't involved. Spread deadlines before the goal's due date, with dependencies first. Output JSON only.

**Output schema:**
```json
{"tasks":[{"title":"string ≤70 chars","description":"1-2 sentences","department_id":"uuid","priority":"high|medium|low","tag":"string","due_date":"YYYY-MM-DD","depends_on_index":[0],"expected_result":"document|link|image"}],
 "notes":"optional string"}
```
UI: Goals → New goal plays the decomposition animation while waiting, then shows the cards. The user confirms with "Create goal & puzzle".

## 2. Assignee suggestion
Deterministic first, with no LLM needed:
- Candidates are the members of the task's department, excluding the Team Lead unless the department has no other members.
- Score = `capacity − open_load`, with efficiency as the tiebreaker. Set the warning flag if `load + 1 ≥ capacity`.

Optional LLM rerank pass when positions matter (for example, a design task should go to a Designer):
> Given the task and candidate members (position, load, efficiency), choose the best assignee and give a ≤8-word reason. JSON: `{"membership_id":"…","reason":"…"}`

## 3. Sync Mind (knowledge agent)
**Indexing:** each approved result, closed brainstorm idea or connected Notion page goes into `kb_documents`. For files: extract text (PDF, DOCX, XLSX, PPTX via a server parser; images via Claude vision captioning), chunk ~800 tokens, embed into `kb_chunks.embedding`. Use the Voyage embeddings recommended by Anthropic, or any 1024-dim model.

**Query flow:**
1. Embed the query, then run a pgvector top-k (k = 30) search, filtered by the user's visible departments (RLS) and optional goal/department filters parsed from the query.
2. Group the chunks by document and send the candidates to Claude.

> You are Sync Mind, the knowledge base of {workspace}. From the candidate documents, select ONLY those that directly serve the user's request. Remove duplicates and older versions. Order them logically (e.g. by milestone). Return JSON: `{"document_ids":[…],"summary":"2-3 sentences","grouping":[{"label":"…","document_ids":[…]}]}`. Never invent documents.

3. Save the result to `kb_compilations` and show it as "Compiled set". **Export bundle** zips the files, or creates a Drive folder with shortcuts.

Suggested chips: "Everything launch-related for September", "Pricing + go-to-market docs only", "All approved technical specs".

## 4. Brainstorm → Sync Mind (phase 2)
After a session closes, offer "Ask Sync Mind to group the ideas or turn them into a goal":
- Clustering prompt: group the ideas into themes.
- Optional: draft a goal and feed it into decomposition.
