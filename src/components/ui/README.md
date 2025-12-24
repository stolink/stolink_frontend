# UI Components Library

> 프로젝트 전체에서 사용하는 공통 UI 컴포넌트 문서

---

## 목차

1. [PageHeader](#pageheader)
2. [StatCard](#statcard)
3. [Toggle](#toggle)
4. [SettingRow](#settingrow)

---

## PageHeader

페이지 상단의 제목과 설명을 표시합니다.

### Props

| Prop          | Type         | Required | Default         | Description             |
| ------------- | ------------ | -------- | --------------- | ----------------------- |
| `icon`        | `LucideIcon` | ✅       | -               | 제목 옆에 표시할 아이콘 |
| `title`       | `string`     | ✅       | -               | 페이지 제목             |
| `description` | `string`     | ❌       | -               | 페이지 설명             |
| `iconColor`   | `string`     | ❌       | `text-sage-500` | 아이콘 색상 클래스      |

### 사용 예시

```tsx
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";

<PageHeader
  icon={BarChart3}
  title="통계"
  description="작품의 진행 상황과 집필 통계를 확인하세요"
/>;
```

---

## StatCard

통계 정보를 카드 형태로 표시합니다.

### Props

| Prop       | Type                                              | Required | Default | Description        |
| ---------- | ------------------------------------------------- | -------- | ------- | ------------------ |
| `icon`     | `LucideIcon`                                      | ✅       | -       | 표시할 아이콘      |
| `value`    | `string \| number`                                | ✅       | -       | 통계 값            |
| `label`    | `string`                                          | ✅       | -       | 라벨 텍스트        |
| `color`    | `sage \| amber \| blue \| purple \| red \| green` | ❌       | `sage`  | 색상 테마          |
| `centered` | `boolean`                                         | ❌       | `false` | 중앙 정렬 레이아웃 |

### 사용 예시

```tsx
import { FileText } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

// 기본 레이아웃
<StatCard
  icon={FileText}
  value={45230}
  label="총 글자수"
  color="sage"
/>

// 중앙 정렬
<StatCard
  icon={Users}
  value={8}
  label="등장인물"
  color="amber"
  centered
/>
```

---

## Toggle

Boolean 값을 조절하는 스위치 컴포넌트입니다.

### Props

| Prop       | Type                         | Required | Default | Description      |
| ---------- | ---------------------------- | -------- | ------- | ---------------- |
| `checked`  | `boolean`                    | ✅       | -       | 현재 상태        |
| `onChange` | `(checked: boolean) => void` | ✅       | -       | 상태 변경 핸들러 |
| `disabled` | `boolean`                    | ❌       | `false` | 비활성화 상태    |
| `size`     | `sm \| md`                   | ❌       | `md`    | 크기             |

### 사용 예시

```tsx
import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";

const [autoSave, setAutoSave] = useState(true);

<Toggle checked={autoSave} onChange={setAutoSave} />;
```

---

## SettingRow

설정 항목을 레이아웃하는 컴포넌트입니다.

### Props

| Prop          | Type        | Required | Default | Description             |
| ------------- | ----------- | -------- | ------- | ----------------------- |
| `title`       | `string`    | ✅       | -       | 설정 항목 제목          |
| `description` | `string`    | ❌       | -       | 설정 항목 설명          |
| `children`    | `ReactNode` | ✅       | -       | 컨트롤 요소 (Toggle 등) |

### 사용 예시

```tsx
import { Toggle } from "@/components/ui/toggle";
import { SettingRow } from "@/components/ui/setting-row";

<SettingRow title="자동 저장" description="30초마다 자동 저장">
  <Toggle checked={autoSave} onChange={setAutoSave} />
</SettingRow>;
```

---

## 기존 UI 컴포넌트 (shadcn/ui 기반)

| 컴포넌트 | 파일           | 설명            |
| -------- | -------------- | --------------- |
| Button   | `button.tsx`   | 버튼            |
| Card     | `card.tsx`     | 카드 컨테이너   |
| Input    | `input.tsx`    | 텍스트 입력     |
| Dialog   | `dialog.tsx`   | 모달 다이얼로그 |
| Tabs     | `tabs.tsx`     | 탭 네비게이션   |
| Select   | `select.tsx`   | 셀렉트 박스     |
| Badge    | `badge.tsx`    | 뱃지            |
| Progress | `progress.tsx` | 진행률 바       |
