# S02.7.2 — Real Milestones Read-Model

This slice binds `ActiveCaseWorkspace` to the existing backend case data.

- No schema or migration changes.
- No finance business-logic changes.
- `GET /api/cases/:id` now returns the case with agreement/quote context and the existing representation milestones.
- The UI renders milestone `id`, `title`, `stage`, `percentage`, `amount`, and `status` from the backend.
- Finance buttons receive the real milestone IDs; no financial calculations are performed in the UI.
