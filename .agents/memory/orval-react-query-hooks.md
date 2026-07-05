---
name: Orval react-query hook options
description: How generated query/mutation hooks must be called in web artifacts (queryKey required, void mutations)
---

# Orval-generated react-query hooks

The OpenAPI codegen (`pnpm --filter @workspace/api-spec run codegen`) emits react-query hooks whose `query` options object **requires `queryKey`** — passing only `{ enabled: ... }` fails typecheck (TS2741 "Property 'queryKey' is missing").

**Rule:** always pass the generated key getter:
```ts
useGetAdminOverview({ query: { enabled: !!token, queryKey: getGetAdminOverviewQueryKey() } })
```
Each hook has a matching `get<OpName>QueryKey()` exported from `@workspace/api-client-react`.

**Void mutations:** operations with no request body/params generate a mutation whose `mutate` takes **no argument**. Call `mutation.mutate()`, not `mutation.mutate({})` (the latter fails with "Argument of type '{}' is not assignable to parameter of type 'void'").

**Why:** design subagents frequently scaffold these hooks with `{ enabled }` only and `mutate({})`, which passes review visually but breaks `tsc`. Always run `pnpm --filter @workspace/<slug> run typecheck` on subagent-generated frontends before considering them done.
