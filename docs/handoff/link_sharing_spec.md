# Link Sharing Feature - Frontend Implementation Handoff

이 문서는 프론트엔드에 구현된 **링크 공유(Link Sharing)** 기능의 명세와 백엔드 요구사항을 정리한 문서입니다. `API_SPEC.md` v1.1을 기준으로 구현되었습니다.

## 1. 구현된 기능

- **공유 설정 관리**: 프로젝트 설정 페이지에서 공유 링크 생성, 조회, 삭제
- **공유된 프로젝트 뷰어**: 비밀번호 보호 지원, 읽기 전용 뷰어 (BookReader 모드)

## 2. 사용된 API 엔드포인트

| Method   | Endpoint                  | 설명                        | 상태         |
| -------- | ------------------------- | --------------------------- | ------------ |
| `GET`    | `/api/projects/:id/share` | 공유 설정 조회              | ✅ 구현 완료 |
| `POST`   | `/api/projects/:id/share` | 공유 링크 생성              | ✅ 구현 완료 |
| `DELETE` | `/api/projects/:id/share` | 공유 링크 삭제              | ✅ 구현 완료 |
| `GET`    | `/api/share/:shareId`     | 공유된 프로젝트 데이터 조회 | ✅ 구현 완료 |

## 3. 데이터 구조 요구사항

### 3.1. 공유 설정 (`ShareSettings`)

`GET /api/projects/:id/share` 응답 및 `POST` 생성 응답

```typescript
interface ShareSettings {
  shareId: string; // 공유 고유 ID (UUID 등)
  shareUrl: string; // 전체 공유 URL (프론트엔드에서 보여주기 용)
  expiresAt: string; // 만료일 (ISO 8601)
  hasPassword: boolean; // 비밀번호 설정 여부
}
```

### 3.2. 공유된 프로젝트 (`SharedProject`)

`GET /api/share/:shareId` 응답

**요구사항:**

- **트리 구조**: `documents` 필드는 재귀적인 트리 구조여야 합니다.
- **콘텐츠 포함**: `text` 타입의 문서는 `content` 필드에 HTML 내용을 포함해야 합니다.
- **대소문자 처리**: `type`은 `folder`/`text` (소문자) 또는 `FOLDER`/`TEXT` (대문자) 모두 처리 가능하도록 구현되었으나, 일관성을 위해 소문자 권장.

```typescript
interface SharedProject {
  id: string;
  title: string;
  description?: string;
  documents: SharedDocument[];
}

interface SharedDocument {
  id: string;
  title: string;
  type: "folder" | "text";
  content?: string; // 본문 내용 (type이 text일 때 필수)
  wordCount?: number; // 글자 수
  children?: SharedDocument[]; // 하위 문서 (폴더일 경우)
}
```

## 4. 에러 처리 및 특이사항

### 4.1. 비밀번호 보호 프로젝트

- **상황**: 비밀번호가 설정된 공유 링크에 접속 시 (`GET /api/share/:shareId`)
- **기대 동작**:
  1. 백엔드는 `403 Forbidden` 상태 코드를 반환해야 합니다.
  2. 프론트엔드는 `403` 수신 시 비밀번호 입력 모달을 띄웁니다.
  3. 사용자가 비밀번호 입력 후 재요청 시, 쿼리 파라미터로 비밀번호를 전송합니다.
     - 요청: `GET /api/share/:shareId?password=사용자입력값`

### 4.2. 읽기 전용 모드

- 프론트엔드 뷰어(`SharedProjectPage`)는 편집 기능(저장, 수정, 삭제 등)을 호출하지 않습니다.
- 백엔드에서도 해당 `shareId`로 접근 시 **쓰기 권한이 없도록** 보안 처리가 필요합니다.

## 5. UI/UX 참고사항

- 공유된 프로젝트는 `BookReaderModal` 컴포넌트를 사용하여 "책 읽기" 경험을 제공합니다.
- 따라서 `documents` 트리를 순회하여 `content`가 있는 모든 `text` 노드를 추출, 평탄화(flatten)하여 보여줍니다.
