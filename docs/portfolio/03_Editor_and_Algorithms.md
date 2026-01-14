# 📝 테크니컬 챌린지: 에디터 안정성 및 자료구조 최적화

> **주제**: Rich Text Editor(Tiptap)의 상태 관리 복잡성을 해결한 패턴과, 대규모 트리 구조 데이터를 다루는 알고리즘 최적화 사례입니다.

---

## Challenge 5: useRef 패턴을 이용한 에디터 인스턴스 안정화

### 🛑 문제 상황 (Problem)

Tiptap(Prosemirror 기반) 에디터 사용 시, `useEditor` 훅의 의존성 배열에 콜백 함수(`onUpdate`)를 포함해야 했습니다.
하지만 부모 컴포넌트가 리렌더링되어 `onUpdate` 함수가 새로 생성될 때마다 **에디터 인스턴스가 파괴되고 재생성(Re-initialization)**되는 문제가 발생했습니다. 이로 인해 타이핑 도중 **커서 위치(Focus)가 초기화**되거나 입력 지연(Lag), 깜빡임 현상이 발생하여 사용자 경험이 치명적으로 저해되었습니다.

### 🧩 해결 전략 (Solution)

**"Stable Callback Ref Pattern"**을 적용하여, 에디터의 의존성(Dependencies)과 콜백의 최신성(Freshness)을 분리했습니다. 함수 자체가 아닌 **함수의 참조(Reference)**를 구독하게 함으로써 리렌더링의 고리를 끊었습니다.

```typescript
// Problem: onContentChange가 바뀔 때마다 에디터가 통째로 재성생됨
// const editor = useEditor({ onUpdate: ... }, [onContentChange]);

// Solution:
// 1. 변경되는 콜백을 ref에 담아 "안정적인 참조"로 만듦
const onUpdateRef = useRef(onContentChange);

// 2. React Lifecycle과 동기화하여 ref만 갱신 (렌더링 유발 X)
useEffect(() => {
  onUpdateRef.current = onContentChange;
}, [onContentChange]);

const editor = useEditor({
  extensions: [...],
  onUpdate: ({ editor }) => {
    // 3. 에디터 내부에서는 ref.current를 통해 항상 "최신 로직"에 접근
    // 하지만 의존성 배열([])은 비어 있음 → 에디터 재생성 방지
    onUpdateRef.current?.(editor.getHTML());
  },
}, []); // 의존성 없음!
```

### 📈 성과 (Impact)

- **에디터 재생성 0회**: 부모 컴포넌트가 아무리 리렌더링되어도 에디터는 최초 1회만 생성됨.
- **Typing Integrity**: 커서 위치 튐 현상, 입력 씹힘 현상 완전 제거.
- **성능 최적화**: 무거운 ProseMirror 인스턴스 초기화 비용 제거.

---

## Challenge 6: O(n log n) 트리 변환 알고리즘의 메모이제이션

### 🛑 문제 상황 (Problem)

프로젝트 문서(Document) 구조는 Scrivener와 유사한 무한 깊이의 폴더/파일 트리 구조를 가집니다.
사이드바에서 트리 노드를 클릭하거나 호버할 때마다, 수평적인 배열(Flat Array) 데이터를 계층적 트리(Tree)로 변환하는 `buildTree` 함수가 매번 실행되었습니다.

`buildTree`는 **Map 생성(O(n))** + **관계 연결(O(n))** + **정렬(O(n log n))** 과정을 거치는데, 문서가 수백 개일 때 단순 클릭 한 번에도 15ms~20ms의 연산이 발생하여 UI 반응성을 떨어뜨렸습니다.

### 🧩 해결 전략 (Solution)

**"Immutable Data Memoization"** 전략을 사용하여, 데이터의 내용이 실제로 변경되었을 때만 무거운 트리 변환 연산을 수행하도록 최적화했습니다. React의 근본적인 비교 메커니즘인 `Referential Equality(참조 동등성)`를 활용했습니다.

```typescript
// Algorithm: Flat Array -> Nested Tree
function buildTree(documents: Document[]): TreeNode[] {
  const map = new Map();
  // ... O(n log n) 로직 ...
  return sortedRoots;
}

// React Component
function DocumentSidebar({ documents }: Props) {
  // Before: 렌더링마다 무거운 연산 실행
  // const tree = buildTree(documents);

  // After: documents 배열의 "참조"가 바뀔 때만 재연산
  // 불변성(Immutability) 원칙 덕분에, 내용이 같다면 참조도 같음이 보장됨
  const tree = useMemo(() => buildTree(documents), [documents]);

  return <TreeView data={tree} />;
}
```

### 📈 성과 (Impact)

- **99% 연산 제거**: 단순 클릭, 호버 등 데이터 변경 없는 인터랙션 시 연산 비용 **0ms**.
- **반응성 극대화**: 노드 확장/축소(Toggle) 동작이 즉각적으로 반응.
- **GC(Garbage Collection) 부하 감소**: 불필요한 객체 생성 및 폐기 사이클 제거.
