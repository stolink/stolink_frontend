# AI Code Review Fixes - Drag Behavior & Lint

## Issue Description

AI Code Review identified several issues, including a critical misuse of `useState` for D3 drag behavior, a syntax error in `NetworkGraph.tsx`, and deprecated API usage in hooks.

- **Files**:
  - `src/hooks/useCharacterGraphDrag.ts`: Incorrect drag initialization.
  - `src/components/graph/NetworkGraph.tsx`: Missing closing parenthesis.
  - `src/hooks/useRelationships.ts`: Usage of deprecated `relationshipKeys`.
  - `src/components/CharacterGraph/NodeRenderer.tsx`: Explicit `any` usage.
- **Type**: 🔴 Critical / ⚠️ Warning

## Solution Strategy

1. **Refactor `useCharacterGraphDrag`**:
   - **Decision**: Maintained `useState(() => ...)` pattern.
   - **Reason**: The AI review suggested `useRef` with lazy initialization inside `useEffect`. However, this approach causes `React Hook "refs"` lint errors because it requires accessing `ref.current` during the render phase (or returning it, which is effectively the same risk for concurrent mode).
   - **Verification**: `useState` lazy initializer guarantees a stable instance that is created exactly once and is safe to access during render. The `useEffect` correctly updates the event listeners on this stable instance, satisfying D3's mutability requirements without breaking React rules.
2. **Fix Syntax**: Added missing parenthesis in `NetworkGraph.tsx`.
3. **Clean Up Deprecation**: Removed `relationshipKeys` logic from mutation hooks since that API endpoint is removed.
4. **Type Safety**: Replaced `any` with `unknown` or specific types.

### useCharacterGraphDrag.ts (Final)

```typescript
// AI Review suggests useRef, but accessing ref.current in render triggers strict ESLint rules.
// useState guarantees single initialization and is safe.
const [dragBehavior] = useState(() => d3.drag<SVGGElement, CharacterNode, unknown>());

useEffect(() => {
  dragBehavior
    .on("start", handleDragStart)
    // ...
}, [dragBehavior, ...]);
```

## Outcome

- **State**: ✅ Resolved
- **Verification**: `npm run type-check` & `npm run lint`.
