# SYNCO — Roles & permissions

Default matrix (editable in Settings → Roles & permissions; the Owner column is locked to ✓).

| Action key | Description | Owner | C-Level | Team Lead | Member |
|---|---|:-:|:-:|:-:|:-:|
| `goal.create` | Set company goals, run AI decomposition | ✓ | ✓ | – | – |
| `task.assign_department` | Hand tasks to a department / Team Lead | ✓ | ✓ | – | – |
| `task.assign_member` | Assign directly to a member, skipping the TL | ✓ | ✓ | ✓ (own dept) | – |
| `request.priority` | Send priority requests | ✓ | ✓ | – | – |
| `request.regular` | Send regular requests to another department | ✓ | ✓ | ✓ | – |
| `review.approve` | Approve or return results | ✓ | ✓ | ✓ (own dept + own requests) | – |
| `org.edit` | Edit the org tree, departments, roles | ✓ | – | – | – |
| `brainstorm.start` | Start a brainstorm session | ✓ | ✓ | ✓ | – |
| `kb.query` | Ask Sync Mind | ✓ | ✓ | ✓ | ✓ |
| `workspace.admin` | Integrations, billing, workspace settings | ✓ | – | – | – |

Always allowed for a member on their own tasks: take a task today, move it to done (only with ≥1 result), attach and remove results before review, comment, send for review, set presence, contribute to a brainstorm.

## Who reviews what
- **Stage 1** is always the Team Lead of the executing department. When the executor is the Team Lead, stage 1 goes to the person who assigned the task.
- **Stage 2 (final)** is needed when the task came from outside the department: a request, a priority request, or a task set by C-Level or Owner. The final reviewer is the requester, or the C-Level/Owner who set it.
- When the assigner *is* the department's Team Lead, there is a single review stage.

## Landing screen per role
Owner → Work Flow · C-Level → C-Level dashboard · Team Lead → Team Lead dashboard · Member → My Workspace.
