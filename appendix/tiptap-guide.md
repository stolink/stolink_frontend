# Tiptap Guide

> **AI 참조용**: Tiptap 3.x 에디터 작업 시 Extension 패턴 및 주의사항 참조하세요.

## Extension 기본 구조

```typescript
import { Extension } from "@tiptap/core";

export const CustomExtension = Extension.create({
  name: "customExtension",

  addOptions() {
    return { option1: "default" };
  },

  addCommands() {
    return {
      customCommand:
        (attrs) =>
        ({ commands }) => {
          return commands.insertContent("...");
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-k": () => this.editor.commands.customCommand(),
    };
  },
});
```

---

## 커스텀 노드뷰 (ReactNodeViewRenderer)

```typescript
import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';

export const CustomNode = Node.create({
  name: 'customNode',
  group: 'block',
  addNodeView() {
    return ReactNodeViewRenderer(CustomNodeComponent);
  },
});

// Component
export const CustomNodeComponent = ({ node, updateAttributes }) => {
  return (
    <NodeViewWrapper className="custom-node">
      {/* 커스텀 UI */}
    </NodeViewWrapper>
  );
};
```

---

## Suggestion 패턴 (Mention)

```typescript
import { Mention } from "@tiptap/extension-mention";

Mention.configure({
  HTMLAttributes: { class: "mention" },
  suggestion: {
    items: ({ query }) =>
      characters.filter((char) =>
        char.name.toLowerCase().startsWith(query.toLowerCase()),
      ),
    render: () => ({
      onStart: (props) => (component = new SuggestionList(props)),
      onUpdate: (props) => component.updateProps(props),
      onExit: () => component.destroy(),
    }),
  },
});
```

---

## ❌ 중복 Extension 등록 금지

**문제**:

```typescript
// 잘못된 예시
const editor = useEditor({
  extensions: [
    StarterKit, // ← Underline, Bold 등 포함
    Underline, // ← 중복!
  ],
});
```

**해결**:

```typescript
// 올바른 예시
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      bold: false, // StarterKit에서 제외
    }),
    CustomBold, // 커스텀 extension 추가
  ],
});
```

**StarterKit 포함 Extensions**:

- `Bold`, `Italic`, `Strike`, `Code`
- `Paragraph`, `Text`, `Document`
- `Heading`, `BulletList`, `OrderedList`
- `Blockquote`, `CodeBlock`
- `HardBreak`, `HorizontalRule`
- `History` (Undo/Redo)

---

## ProseMirror 핵심 개념

### Node vs Mark

- **Node**: `paragraph`, `heading`, `image` (블록 레벨)
- **Mark**: `bold`, `italic`, `link` (인라인 레벨)

### Transaction

- 모든 문서 변경은 Transaction으로 처리
- `editor.state.tr.insertText('...')`
- `onTransaction` 이벤트에서 캐치

---

## 자주 사용하는 Commands

```typescript
// 텍스트 삽입
editor.commands.insertContent("text");

// 마크 토글
editor.commands.toggleBold();
editor.commands.toggleItalic();

// 노드 설정
editor.commands.setHeading({ level: 1 });
editor.commands.setParagraph();

// 콘텐츠 교체
editor.commands.setContent("<p>New content</p>");

// 체이닝
editor.chain().focus().toggleBold().insertContent("text").run();
```

---

## InputRule 패턴

특정 입력 패턴을 자동 변환:

```typescript
import { InputRule } from "@tiptap/core";

// 마크다운 스타일 볼드: **text** → <strong>text</strong>
const boldInputRule = new InputRule({
  find: /\*\*([^\*]+)\*\*$/,
  handler: ({ state, range, match }) => {
    const { tr } = state;
    tr.replaceWith(
      range.from,
      range.to,
      state.schema.text(match[1]).mark([state.schema.marks.bold.create()]),
    );
  },
});
```

---

## 성능 최적화

### 1. 디바운스 사용

```typescript
const debouncedUpdate = useDebouncedCallback(
  (content) => saveDocument(content),
  1500,
);

editor.on("update", ({ editor }) => {
  debouncedUpdate(editor.getHTML());
});
```

### 2. Transaction 배치 처리

```typescript
editor
  .chain()
  .insertContent("text1")
  .insertContent("text2")
  .insertContent("text3")
  .run(); // 한 번의 transaction으로 처리
```

### 3. 불필요한 Re-render 방지

```typescript
// ❌ 매번 리렌더링
const content = editor.getHTML();

// ✅ 필요할 때만
const saveContent = () => {
  const content = editor.getHTML();
  save(content);
};
```

---

## D3 타입 정의 (드래그)

```typescript
const dragStarted = useCallback(
  (
    e: d3.D3DragEvent<SVGCircleElement, NetworkNode, NetworkNode>,
    d: NetworkNode,
  ) => {
    if (!simulation.current) return;
    if (e.active === 0) simulation.current.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
  },
  [],
);
```
