# 백엔드 팀 협의 사항: 프론트엔드 배포 환경 설정

## 📋 상황 설명

안녕하세요! 프론트엔드 팀입니다.

현재 프론트엔드에서 환경 변수 기반으로 백엔드 API와 OAuth를 연동하고 있으며, **프로덕션 배포를 위해 백엔드 쪽 설정이 필요**합니다. 협의가 필요한 사항을 정리했습니다.

---

## 🔧 현재 프론트엔드 설정

### 개발 환경 (.env.development)

```bash
VITE_API_URL=/api
VITE_BACKEND_URL=http://localhost:8080
VITE_COMMUNITY_URL=http://localhost:5174
```

### 동작 방식

- **일반 API 요청**: `/api/*` → Vite proxy → `http://localhost:8080/api/*`
- **Google OAuth**: `http://localhost:8080/oauth2/authorization/google`로 직접 리다이렉트
- **Draft 배포**: `http://localhost:5174/write?draftId={UUID}`로 리다이렉트

---

## 🚀 프로덕션 배포 계획

### 옵션 1: 단일 도메인 (권장)

#### 도메인 구조

```
stolink.com              → 프론트엔드 (React SPA)
stolink.com/api/*        → 백엔드 API
stolink.com/oauth2/*     → 백엔드 OAuth
stolink.com/community/*  → 커뮤니티 서비스
```

#### 프론트엔드 환경 변수

```bash
VITE_API_URL=/api
VITE_BACKEND_URL=https://stolink.com
VITE_COMMUNITY_URL=https://stolink.com/community
```

#### 필요한 인프라

- **Nginx Reverse Proxy** 또는 **API Gateway**
- 백엔드는 내부 포트로만 노출 (예: `backend:8080`)

---

### 옵션 2: 서브도메인

#### 도메인 구조

```
stolink.com         → 프론트엔드
api.stolink.com     → 백엔드 API + OAuth
storead.com         → 커뮤니티 서비스
```

#### 프론트엔드 환경 변수

```bash
VITE_API_URL=https://api.stolink.com/api
VITE_BACKEND_URL=https://api.stolink.com
VITE_COMMUNITY_URL=https://storead.com
```

#### 필요한 백엔드 설정

- **CORS 설정 필수** (아래 참고)

---

## ⚙️ 백엔드에서 필요한 설정

### 1. CORS 설정 (옵션 2 또는 다른 도메인 사용 시)

프론트엔드(`stolink.com`)에서 백엔드(`api.stolink.com`)로 요청할 수 있도록 CORS 설정이 필요합니다.

#### Spring Boot 예시

```java
@Configuration
public class WebConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins(
                        "http://localhost:5173",        // 개발 환경
                        "https://stolink.com"           // 프로덕션
                    )
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true)
                    .maxAge(3600);
            }
        };
    }
}
```

#### 또는 application.yml

```yaml
spring:
  web:
    cors:
      allowed-origins:
        - http://localhost:5173
        - https://stolink.com
      allowed-methods: "*"
      allowed-headers: "*"
      allow-credentials: true
      max-age: 3600
```

---

### 2. Google OAuth Callback URL 등록

Google Cloud Console에서 다음 URL을 **승인된 리디렉션 URI**로 등록해야 합니다.

#### 개발 환경

```
http://localhost:8080/login/oauth2/code/google
```

#### 프로덕션 환경

**옵션 1 (단일 도메인)**:

```
https://stolink.com/login/oauth2/code/google
```

**옵션 2 (서브도메인)**:

```
https://api.stolink.com/login/oauth2/code/google
```

#### 등록 방법

1. Google Cloud Console → API 및 서비스 → 사용자 인증 정보
2. OAuth 2.0 클라이언트 ID 클릭
3. "승인된 리디렉션 URI"에 위 URL 추가
4. 저장

---

### 3. OAuth Success Redirect

Google 로그인 성공 후 **프론트엔드로 리다이렉트**해야 합니다.

#### 현재 필요한 동작

```
Google 로그인 성공 → 백엔드 OAuth 처리 → 프론트엔드로 리다이렉트
```

#### 백엔드에서 설정 필요

**옵션 1 (단일 도메인)**:

```java
// SecurityConfig.java
.oauth2Login(oauth2 -> oauth2
    .defaultSuccessUrl("https://stolink.com/", true)
)
```

**옵션 2 (서브도메인)**:

```java
.oauth2Login(oauth2 -> oauth2
    .defaultSuccessUrl("https://stolink.com/", true)
)
```

또는 환경 변수로 관리:

```yaml
# application.yml
oauth:
  success-redirect-url: ${OAUTH_SUCCESS_URL:http://localhost:5173}
```

---

## 🧪 테스트 시나리오

배포 후 다음 항목을 테스트해주세요:

### 1. API 요청 테스트

```bash
# CORS 확인
curl -X OPTIONS https://api.stolink.com/api/users \
  -H "Origin: https://stolink.com" \
  -H "Access-Control-Request-Method: GET"

# 실제 요청
curl https://stolink.com/api/users
```

### 2. Google 로그인 테스트

1. `https://stolink.com/auth` 접속
2. "Google로 계속하기" 클릭
3. Google 계정 선택
4. **예상 동작**:
   - `https://accounts.google.com/...` 로 리다이렉트
   - 인증 후 `https://stolink.com/` 로 복귀
   - 로그인 상태 유지

### 3. Draft API 테스트

```bash
curl -X POST https://stolink.com/api/drafts \
  -H "Content-Type: application/json" \
  -d '{
    "documentId": "test-doc-id",
    "projectId": "test-project-id",
    "title": "Test Draft",
    "content": "<p>Test content</p>",
    "graphSnapshot": {...}
  }'
```

---

## 📊 협의 필요 사항

다음 사항에 대해 결정이 필요합니다:

### 1. 도메인 구조

- [ ] **옵션 1**: 단일 도메인 (`stolink.com`) - Nginx proxy 필요
- [ ] **옵션 2**: 서브도메인 (`api.stolink.com`) - CORS 설정 필요

**질문**: 어느 방식을 선호하시나요?

---

### 2. 인프라 담당

- [ ] Nginx/API Gateway는 누가 설정하나요?
- [ ] SSL 인증서는 어떻게 관리하나요?

---

### 3. 환경 변수 공유

프로덕션 배포 시 다음 정보가 필요합니다:

- [ ] 백엔드 프로덕션 URL: `________________`
- [ ] 커뮤니티 서비스 URL: `________________`
- [ ] OAuth 리다이렉트 URL: `________________`

---

## 🔗 참고 자료

- [프론트엔드 환경 변수 설정 가이드](./ENV_SETUP.md)
- [Google OAuth 수정 상세](../.gemini/antigravity/brain/ea9f66d4-ee5d-465a-9e6f-2221a5ad9474/google_login_fix.md)
- [Draft API 연동 문서](../.gemini/antigravity/brain/ea9f66d4-ee5d-465a-9e6f-2221a5ad9474/walkthrough.md)

---

## 👥 연락처

프론트엔드 담당자: [이름]  
백엔드 담당자: [이름]  
DevOps 담당자: [이름]

---

**논의 필요 시 언제든 연락 주세요!** 🙌
