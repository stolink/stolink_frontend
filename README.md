# Sto-Link (스토리링크)

> **당신의 이야기, 하나도 놓치지 않게.**
> AI 기반 작판용 스마트 스토리 관리 및 에디터 플랫폼

![Sto-Link Hero Animation](https://github.com/ssyy3034/sto-link-front/raw/main/src/assets/main_logo.png)

Sto-Link는 작가의 창의력을 극대화하기 위해 설계된 올인원 집필 환경입니다. 복잡한 복선 설정, 캐릭터 관계도, 세계관 설정을 AI가 함께 관리하여 작가가 오직 '이야기'에만 집중할 수 있도록 돕습니다.

---

## ✨ 핵심 기능 (Core Features)

### ✍️ 스마트 마크다운 에디터

- **Tiptap 기반 리치 텍스트**: 마크다운의 편리함과 위지위그(WYSIWYG)의 직관성을 동시에 제공합니다.
- **실시간 자동 저장**: 디바운스 기술을 적용하여 집필 중단 1.5초 후 안전하게 서버에 동기화합니다.
- **몰입형 독서 모드**: 종이책 느낌의 레이아웃과 커스텀 테마(Light/Dark/Sepia)로 결과물을 확인하세요.

### 🧩 지능형 복선(Foreshadowing) 관리

- **태그 기반 추적**: `#복선:태그명` 문법으로 본문 내 복선을 실시간으로 등록하고 회수 상태를 관리합니다.
- **시각적 하이라이트**: 등록된 복선은 에디터 내에서 세이지(Sage) 톤으로 강조되어 한눈에 들어옵니다.

### 🌐 세계관 및 캐릭터 시각화

- **캐릭터 관계도 (Graph View)**: React Flow를 활용하여 인물 간의 관계(우호, 적대, 가족 등)를 역동적인 그래프로 시각화합니다.
- **설정 보관함**: 캐릭터 아바타, 장소, 아이템 설정을 체계적으로 분류하고 관리합니다.

### 🤖 AI 어시스턴트 (Beta)

- **일관성 체크**: 설정과 모순되는 문장이 나올 경우 AI가 실시간으로 경고를 보냅니다.
- **장면 시각화**: 텍스트를 기반으로 AI가 캐릭터나 장면의 이미지를 생성해 줍니다.

---

## 🛠 기술 스택 (Tech Stack)

### Frontend

- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui (UI Kit)
- **State**: Zustand (UI/Global), TanStack Query v5 (Server)
- **Editor**: Tiptap (ProseMirror 기반)
- **Visualization**: React Flow, Framer Motion
- **Tooling**: Axios, Zod, React Hook Form

### Backend & AI (Infrastructure)

- **Server**: Spring Boot
- **AI Engine**: FastAPI, LangGraph, LLM (GPT-4o/Claude 3.5)
- **Database**: PostgreSQL (Relational), Neo4j (Graph)

---

## 🚀 시작하기 (Getting Started)

### Prerequisites

- Node.js (v18+)
- npm 또는 pnpm

### Installation

```bash
# 저장소 클론
git clone https://github.com/ssyy3034/sto-link-front.git
cd sto-link-front

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.development

# 개발 서버 실행
npm run dev
```

---

## 📁 프로젝트 구조 (Project Structure)

```
src/
├── api/          # Axios HTTP 클라이언트 및 API 정의
├── components/   # 재사용 가능한 UI 및 에디터/그래프 전용 컴포넌트
├── pages/        # 랜딩, 서재, 에디터, 세계관 등 페이지 컴포넌트
├── stores/       # Zustand 상태 저장소
├── types/        # TypeScript 인터페이스 및 타입 정의
└── styles/       # Tailwind 전역 스타일링
```

---

## 📄 라이선스 (License)

Copyright © 2024 StoLink. All rights reserved.
이 프로젝트의 무단 복제 및 배포를 금합니다.
