# 환경 변수 설정 가이드

## 🔧 개발 환경 설정

### 1. 기본 설정 (대부분의 경우)

별도 설정 불필요! `git pull` 후 바로 실행:

```bash
npm install
npm run dev
```

`.env.development` 파일이 자동으로 적용됩니다.

---

### 2. 개인 설정이 필요한 경우

다음과 같은 경우 개인 설정이 필요합니다:

- 백엔드를 다른 포트에서 실행 (예: 9090)
- 로컬에서 다른 커뮤니티 서비스 URL 사용
- 특정 기능 테스트를 위한 환경 변수 변경

**방법**:

1. `.env.development.local` 파일 생성 (Git 무시됨)
2. 변경하고 싶은 변수만 추가:
   ```bash
   # 예시: 백엔드 포트 변경
   VITE_BACKEND_URL=http://localhost:9090
   ```

---

## 📋 환경 변수 목록

### `VITE_API_URL`

- **용도**: API 요청 엔드포인트
- **기본값**: `/api`
- **설명**: Vite proxy를 통해 백엔드로 전달됩니다.

### `VITE_BACKEND_URL`

- **용도**: OAuth 리다이렉트용 백엔드 절대 경로
- **기본값**: `http://localhost:8080`
- **설명**: Google 로그인 등 브라우저 리다이렉트에 사용됩니다.

### `VITE_COMMUNITY_URL`

- **용도**: 커뮤니티 서비스(Storead) URL
- **기본값**: `http://localhost:5174`
- **설명**: Draft 배포 시 리다이렉트 URL로 사용됩니다.

---

## 🚨 주의사항

1. **절대 커밋하지 말 것**:
   - `.env.local`
   - `.env.development.local`
   - API 키, 시크릿 등 민감 정보

2. **팀 공유 설정**:
   - `.env.development` - Git에 커밋 ✅
   - 민감 정보 없는 개발 환경 기본값

3. **환경 변수 변경 후**:
   - **반드시 Vite dev server 재시작** 필요
   - Hot reload로 적용되지 않습니다!

---

## 📖 참고 자료

- [Vite 환경 변수 문서](https://vitejs.dev/guide/env-and-mode.html)
- 프로젝트 설정 상세: `google_login_fix.md`
