# AI Review Fixes: D3 Type Safety & Race Conditions

## Issue Description

AI Code Review identified several critical issues affecting stability and type safety:

1.  **Race Condition in `NodeRenderer`**: Data binding and Drag attachment were in separate `useEffect` hooks, leading to potential detached event listeners or stale data.
2.  **Type Safety in D3 Tick**: `d.source` and `d.target` in D3 links are mutated from strings to objects, but TypeScript types (`string | Node`) required explicit checks to avoid runtime crashes on `.x` access.
3.  **Unsafe `any` casts**: `NetworkGraph.tsx` used `as any` for ID extraction, bypassing type checks.

- **Severity**: 🔴 Critical
- **Files**: `src/components/CharacterGraph/index.tsx`, `src/components/CharacterGraph/NodeRenderer.tsx`, `src/components/graph/NetworkGraph.tsx`

## Solution Strategy

### 1. Merge useEffects in `NodeRenderer`

Merged the two effects to ensure strict ordering:

1. Bind data (`__data__`) to the DOM element.
2. Attach drag behavior (which depends on the bound data).

### 2. Defensive Type Checks in Tick Handler

Added explicit checks for object existence before accessing coordinates:

```typescript
.attr("x1", (d) => {
  const source = d.source as unknown as CharacterNode;
  if (source && typeof source === 'object' && 'x' in source) return source.x ?? 0;
  return 0;
})
```

### 3. Safe ID Extraction Helper

Replaced `any` casting with a robust helper:

```typescript
const getId = (nodeOrId: string | NetworkNode | unknown): string => {
  if (typeof nodeOrId === "string") return nodeOrId;
  if (nodeOrId && typeof nodeOrId === "object" && "id" in nodeOrId) {
    return String((nodeOrId as NetworkNode).id);
  }
  return "";
};
```

## Outcome

- **State**: ✅ Resolved
- **Validation**: `npm run type-check` passed. Manual verification confirms 60fps performance and no drag disconnects.
