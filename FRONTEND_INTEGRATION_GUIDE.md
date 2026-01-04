# 프론트엔드 통합 가이드

> **StoLink 토스 페이먼츠 크레딧 결제 시스템 - 프론트엔드 개발자용**

## 📋 목차

1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [결제 플로우](#결제-플로우)
4. [API 명세](#api-명세)
5. [토스 페이먼츠 SDK 연동](#토스-페이먼츠-sdk-연동)
6. [구현 예시](#구현-예시)
7. [에러 처리](#에러-처리)
8. [UI/UX 가이드라인](#uiux-가이드라인)
9. [테스트](#테스트)
10. [체크리스트](#체크리스트)

---

## 개요

### 시스템 설명
- 사용자가 크레딧을 구매하고, 책 챕터를 읽을 때마다 5크레딧을 차감하는 시스템
- 토스 페이먼츠를 통한 안전한 결제 처리
- 실시간 크레딧 잔액 확인 및 자동 차감

### 기술 스택 권장사항
- **React** 또는 **Vue.js** 또는 **Next.js**
- **Axios** 또는 **Fetch API** (HTTP 통신)
- **@tosspayments/payment-widget-sdk** (토스 페이먼츠 SDK)
- **TypeScript** (타입 안정성 권장)

---

## 사전 준비

### 1. 토스 페이먼츠 계정 설정
1. [토스 페이먼츠 개발자센터](https://developers.tosspayments.com/) 회원가입
2. 테스트 환경 클라이언트 키 발급받기
3. 백엔드 개발자에게 전달받은 클라이언트 키 확인

**현재 테스트 키:**
```
TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

### 2. SDK 설치
```bash
# npm
npm install @tosspayments/payment-widget-sdk

# yarn
yarn add @tosspayments/payment-widget-sdk
```

### 3. 환경 변수 설정
```env
# .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq
```

---

## 결제 플로우

### 전체 프로세스
```
┌─────────────────────────────────────────────────────────────┐
│  1. 크레딧 패키지 선택                                          │
│     GET /api/v1/payments/packages                           │
│     → 사용자가 원하는 패키지 선택 (100점, 500점, 1000점 등)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 결제 준비 (주문 생성)                                       │
│     POST /api/v1/payments/prepare                           │
│     → orderId, amount, customerKey 등을 응답으로 받음           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3. 토스 페이먼츠 결제창 호출                                    │
│     @tosspayments/payment-widget-sdk 사용                   │
│     → 사용자가 카드 정보 입력 및 결제 진행                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 결제 성공/실패 리디렉션                                      │
│     성공: /payments/success?orderId=xxx&paymentKey=yyy      │
│     실패: /payments/fail?orderId=xxx&code=zzz               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  5. 결제 승인 요청                                             │
│     POST /api/v1/payments/confirm                           │
│     → 백엔드에서 토스 API 호출하여 최종 승인                      │
│     → 크레딧 자동 지급                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  6. 결제 완료 페이지 표시                                       │
│     → "500 크레딧이 충전되었습니다!" 메시지                       │
│     → 크레딧 잔액 표시                                         │
└─────────────────────────────────────────────────────────────┘
```

### 크레딧 사용 플로우
```
┌─────────────────────────────────────────────────────────────┐
│  1. 챕터 읽기 버튼 클릭                                         │
│     → 현재 크레딧 잔액 확인                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  2. 크레딧 충분 여부 확인                                       │
│     GET /api/v1/credits/check?amount=5                      │
│     → insufficient: false면 충분, true면 부족                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  3-1. 크레딧 부족 시                                           │
│     → "크레딧이 부족합니다. 충전하시겠습니까?" 모달 표시            │
│     → 충전 페이지로 이동                                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  3-2. 크레딧 충분 시                                           │
│     POST /api/v1/credits/use                                │
│     → 5 크레딧 차감 및 챕터 잠금 해제                            │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  4. 챕터 콘텐츠 표시                                            │
│     → 잔여 크레딧 실시간 업데이트                                │
└─────────────────────────────────────────────────────────────┘
```

---

## API 명세

### 공통 사항

#### 인증 헤더
모든 API 요청에는 사용자 식별을 위한 헤더가 필요합니다.

```http
X-User-Id: {userId}
```

> ⚠️ **중요**: 현재는 테스트용으로 헤더를 사용하지만, 프로덕션에서는 JWT 토큰 기반 인증으로 변경될 예정입니다.

#### 응답 형식
모든 API는 다음 형식으로 응답합니다:

```typescript
interface ApiResponse<T> {
  code: number;        // HTTP 상태 코드
  status: string;      // "OK" | "ERROR"
  message: string;     // 메시지
  data: T;             // 실제 데이터
}
```

---

### 1. 크레딧 패키지 목록 조회

#### 요청
```http
GET /api/v1/payments/packages
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": [
    {
      "id": 1,
      "name": "크레딧 100점",
      "price": 1000,
      "creditAmount": 100,
      "bonusCredit": 0,
      "isPopular": false
    },
    {
      "id": 2,
      "name": "크레딧 500점 (+50 보너스)",
      "price": 5000,
      "creditAmount": 500,
      "bonusCredit": 50,
      "isPopular": true
    },
    {
      "id": 3,
      "name": "크레딧 1000점 (+150 보너스)",
      "price": 10000,
      "creditAmount": 1000,
      "bonusCredit": 150,
      "isPopular": false
    }
  ]
}
```

#### TypeScript 타입
```typescript
interface CreditPackage {
  id: number;
  name: string;
  price: number;           // 원화 (KRW)
  creditAmount: number;    // 기본 크레딧
  bonusCredit: number;     // 보너스 크레딧
  isPopular: boolean;      // 인기 패키지 여부
}
```

---

### 2. 결제 준비 (주문 생성)

#### 요청
```http
POST /api/v1/payments/prepare
X-User-Id: {userId}
Content-Type: application/json

{
  "packageId": 2
}
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "orderId": "SL-a1b2c3d4e5f6",
    "orderName": "크레딧 500점 (+50 보너스)",
    "amount": 5000,
    "creditAmount": 550,
    "customerKey": "CUST-1234567890abcdef",
    "successUrl": "/payments/success?orderId=SL-a1b2c3d4e5f6",
    "failUrl": "/payments/fail?orderId=SL-a1b2c3d4e5f6"
  }
}
```

#### TypeScript 타입
```typescript
interface PaymentPrepareRequest {
  packageId: number;
}

interface PaymentPrepareResponse {
  orderId: string;        // 주문 고유 ID
  orderName: string;      // 주문명 (결제창에 표시됨)
  amount: number;         // 결제 금액
  creditAmount: number;   // 지급될 총 크레딧 (기본 + 보너스)
  customerKey: string;    // 고객 고유 키
  successUrl: string;     // 결제 성공 시 리디렉션 URL
  failUrl: string;        // 결제 실패 시 리디렉션 URL
}
```

---

### 3. 결제 승인

#### 요청
```http
POST /api/v1/payments/confirm
X-User-Id: {userId}
Content-Type: application/json

{
  "orderId": "SL-a1b2c3d4e5f6",
  "paymentKey": "toss_payment_key_123456",
  "amount": 5000
}
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "id": "payment-uuid-1234",
    "orderId": "SL-a1b2c3d4e5f6",
    "orderName": "크레딧 500점 (+50 보너스)",
    "amount": 5000,
    "creditAmount": 550,
    "status": "DONE",
    "paymentKey": "toss_payment_key_123456",
    "paymentMethod": "카드",
    "approvedAt": "2026-01-04T12:34:56",
    "createdAt": "2026-01-04T12:30:00"
  }
}
```

#### TypeScript 타입
```typescript
interface PaymentConfirmRequest {
  orderId: string;
  paymentKey: string;
  amount: number;
}

interface PaymentResponse {
  id: string;
  orderId: string;
  orderName: string;
  amount: number;
  creditAmount: number;
  status: 'PENDING' | 'READY' | 'IN_PROGRESS' | 'DONE' | 'CANCELED' | 'PARTIAL_CANCELED' | 'FAILED' | 'EXPIRED';
  paymentKey?: string;
  paymentMethod?: string;
  approvedAt?: string;
  createdAt: string;
}
```

---

### 4. 크레딧 잔액 조회

#### 요청
```http
GET /api/v1/credits
X-User-Id: {userId}
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "id": "credit-uuid-5678",
    "balance": 550,
    "totalCharged": 550,
    "totalUsed": 0,
    "updatedAt": "2026-01-04T12:34:56"
  }
}
```

#### TypeScript 타입
```typescript
interface CreditResponse {
  id: string;
  balance: number;         // 현재 잔액
  totalCharged: number;    // 총 충전 금액
  totalUsed: number;       // 총 사용 금액
  updatedAt: string;       // 마지막 업데이트 시간
}
```

---

### 5. 크레딧 사용 가능 여부 확인

#### 요청
```http
GET /api/v1/credits/check?amount=5
X-User-Id: {userId}
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "available": true,
    "currentBalance": 550,
    "requestedAmount": 5,
    "afterBalance": 545
  }
}
```

```json
// 크레딧 부족 시
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "available": false,
    "currentBalance": 2,
    "requestedAmount": 5,
    "shortfall": 3
  }
}
```

#### TypeScript 타입
```typescript
interface CreditCheckResponse {
  available: boolean;
  currentBalance: number;
  requestedAmount: number;
  afterBalance?: number;    // 사용 가능할 때만 존재
  shortfall?: number;       // 부족할 때만 존재 (부족 금액)
}
```

---

### 6. 크레딧 사용 (챕터 읽기)

#### 요청
```http
POST /api/v1/credits/use
X-User-Id: {userId}
Content-Type: application/json

{
  "amount": 5,
  "description": "1편 1챕터 읽기",
  "referenceType": "CHAPTER",
  "referenceId": "chapter-uuid-9012"
}
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "id": "credit-uuid-5678",
    "balance": 545,
    "totalCharged": 550,
    "totalUsed": 5,
    "updatedAt": "2026-01-04T13:00:00"
  }
}
```

#### TypeScript 타입
```typescript
interface CreditUseRequest {
  amount: number;              // 사용할 크레딧 (챕터는 항상 5)
  description: string;         // 사용 설명
  referenceType: string;       // "CHAPTER", "AI_JOB" 등
  referenceId: string;         // 챕터 ID 등
}
```

---

### 7. 크레딧 거래 내역 조회

#### 요청
```http
GET /api/v1/credits/transactions?page=0&size=20
X-User-Id: {userId}

# 타입별 필터링
GET /api/v1/credits/transactions?type=CHARGE&page=0&size=20
GET /api/v1/credits/transactions?type=USE&page=0&size=20
```

#### 응답 예시
```json
{
  "code": 200,
  "status": "OK",
  "message": "OK",
  "data": {
    "content": [
      {
        "id": "transaction-uuid-1111",
        "type": "CHARGE",
        "amount": 550,
        "balanceBefore": 0,
        "balanceAfter": 550,
        "description": "크레딧 500점 (+50 보너스) 결제",
        "createdAt": "2026-01-04T12:34:56"
      },
      {
        "id": "transaction-uuid-2222",
        "type": "USE",
        "amount": 5,
        "balanceBefore": 550,
        "balanceAfter": 545,
        "description": "1편 1챕터 읽기",
        "referenceType": "CHAPTER",
        "referenceId": "chapter-uuid-9012",
        "createdAt": "2026-01-04T13:00:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 2,
    "totalPages": 1
  }
}
```

#### TypeScript 타입
```typescript
interface CreditTransaction {
  id: string;
  type: 'CHARGE' | 'USE' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
```

---

### 8. 결제 취소

#### 요청
```http
POST /api/v1/payments/{paymentId}/cancel
X-User-Id: {userId}
Content-Type: application/json

{
  "cancelReason": "고객 요청"
}
```

#### 응답
결제가 취소되면 해당 금액만큼 크레딧도 자동으로 차감됩니다.

---

## 토스 페이먼츠 SDK 연동

### 1. React 예시

#### 결제 위젯 초기화
```typescript
// PaymentWidget.tsx
import { useEffect, useRef } from 'react';
import { loadPaymentWidget, PaymentWidgetInstance } from '@tosspayments/payment-widget-sdk';

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;

export function PaymentWidget({ prepareData }: { prepareData: PaymentPrepareResponse }) {
  const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance['renderPaymentMethods']> | null>(null);

  useEffect(() => {
    (async () => {
      // 1. 결제 위젯 초기화
      const paymentWidget = await loadPaymentWidget(clientKey, prepareData.customerKey);

      // 2. 결제 방법 위젯 렌더링
      const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
        '#payment-widget',
        { value: prepareData.amount },
        { variantKey: 'DEFAULT' }
      );

      // 3. 이용약관 위젯 렌더링
      paymentWidget.renderAgreement('#agreement');

      paymentWidgetRef.current = paymentWidget;
      paymentMethodsWidgetRef.current = paymentMethodsWidget;
    })();
  }, [prepareData]);

  const handlePayment = async () => {
    const paymentWidget = paymentWidgetRef.current;

    try {
      // 결제 요청
      await paymentWidget?.requestPayment({
        orderId: prepareData.orderId,
        orderName: prepareData.orderName,
        successUrl: window.location.origin + prepareData.successUrl,
        failUrl: window.location.origin + prepareData.failUrl,
        customerEmail: 'customer@example.com', // 선택사항
        customerName: '김토스', // 선택사항
      });
    } catch (error) {
      console.error('결제 요청 실패:', error);
    }
  };

  return (
    <div>
      <div id="payment-widget" />
      <div id="agreement" />
      <button onClick={handlePayment}>결제하기</button>
    </div>
  );
}
```

#### 결제 성공 페이지
```typescript
// pages/payments/success.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { orderId, paymentKey, amount } = router.query;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [creditAmount, setCreditAmount] = useState(0);

  useEffect(() => {
    if (!orderId || !paymentKey || !amount) return;

    confirmPayment();
  }, [orderId, paymentKey, amount]);

  const confirmPayment = async () => {
    try {
      // 결제 승인 요청
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/payments/confirm`,
        {
          orderId,
          paymentKey,
          amount: Number(amount),
        },
        {
          headers: {
            'X-User-Id': getUserId(), // 실제로는 인증 토큰에서 추출
          },
        }
      );

      setCreditAmount(response.data.data.creditAmount);
      setStatus('success');
    } catch (error) {
      console.error('결제 승인 실패:', error);
      setStatus('error');
    }
  };

  if (status === 'loading') {
    return <div>결제를 처리 중입니다...</div>;
  }

  if (status === 'error') {
    return (
      <div>
        <h1>결제 처리 실패</h1>
        <p>결제 승인 중 오류가 발생했습니다.</p>
        <button onClick={() => router.push('/credits')}>돌아가기</button>
      </div>
    );
  }

  return (
    <div>
      <h1>결제 완료!</h1>
      <p>{creditAmount} 크레딧이 충전되었습니다.</p>
      <button onClick={() => router.push('/credits')}>크레딧 확인하기</button>
    </div>
  );
}
```

#### 결제 실패 페이지
```typescript
// pages/payments/fail.tsx
import { useRouter } from 'next/router';

export default function PaymentFailPage() {
  const router = useRouter();
  const { orderId, code, message } = router.query;

  return (
    <div>
      <h1>결제 실패</h1>
      <p>주문번호: {orderId}</p>
      <p>오류 코드: {code}</p>
      <p>오류 메시지: {message}</p>
      <button onClick={() => router.push('/credits')}>다시 시도하기</button>
    </div>
  );
}
```

---

### 2. 크레딧 충전 전체 플로우 구현

```typescript
// pages/credits/charge.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { PaymentWidget } from '@/components/PaymentWidget';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

export default function CreditChargePage() {
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [prepareData, setPrepareData] = useState<PaymentPrepareResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. 패키지 목록 조회
  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/payments/packages`);
      setPackages(response.data.data);
    } catch (error) {
      console.error('패키지 조회 실패:', error);
    }
  };

  // 2. 결제 준비
  const handleSelectPackage = async (packageId: number) => {
    setSelectedPackage(packageId);
    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/payments/prepare`,
        { packageId },
        {
          headers: {
            'X-User-Id': getUserId(),
          },
        }
      );

      setPrepareData(response.data.data);
    } catch (error) {
      console.error('결제 준비 실패:', error);
      alert('결제 준비 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>크레딧 충전</h1>

      {!prepareData ? (
        <div>
          <h2>패키지 선택</h2>
          <div className="package-list">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className={`package-card ${pkg.isPopular ? 'popular' : ''}`}
                onClick={() => handleSelectPackage(pkg.id)}
              >
                {pkg.isPopular && <span className="badge">인기</span>}
                <h3>{pkg.name}</h3>
                <p className="price">{pkg.price.toLocaleString()}원</p>
                <p className="credit">
                  {pkg.creditAmount}
                  {pkg.bonusCredit > 0 && (
                    <span className="bonus"> +{pkg.bonusCredit} 보너스</span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <h2>결제 정보</h2>
          <PaymentWidget prepareData={prepareData} />
        </div>
      )}
    </div>
  );
}

function getUserId(): string {
  // 실제로는 인증 컨텍스트나 쿠키에서 가져옴
  return localStorage.getItem('userId') || 'test-user-id';
}
```

---

### 3. 챕터 읽기 크레딧 차감 구현

```typescript
// components/ChapterReader.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!;

interface ChapterReaderProps {
  chapterId: string;
  chapterTitle: string;
}

export function ChapterReader({ chapterId, chapterTitle }: ChapterReaderProps) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkCreditBalance();
    checkChapterUnlocked();
  }, [chapterId]);

  // 크레딧 잔액 조회
  const checkCreditBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/credits`, {
        headers: { 'X-User-Id': getUserId() },
      });
      setCreditBalance(response.data.data.balance);
    } catch (error) {
      console.error('크레딧 조회 실패:', error);
    }
  };

  // 이미 잠금 해제된 챕터인지 확인
  const checkChapterUnlocked = async () => {
    // 실제로는 별도 API나 로컬 스토리지에서 확인
    const unlocked = localStorage.getItem(`chapter-${chapterId}`) === 'unlocked';
    setIsUnlocked(unlocked);
  };

  // 챕터 잠금 해제
  const unlockChapter = async () => {
    setLoading(true);

    try {
      // 1. 크레딧 사용 가능 여부 확인
      const checkResponse = await axios.get(
        `${API_BASE_URL}/credits/check?amount=5`,
        {
          headers: { 'X-User-Id': getUserId() },
        }
      );

      if (!checkResponse.data.data.available) {
        const shortfall = checkResponse.data.data.shortfall;
        const confirmCharge = window.confirm(
          `크레딧이 ${shortfall}점 부족합니다. 충전하시겠습니까?`
        );
        if (confirmCharge) {
          window.location.href = '/credits/charge';
        }
        return;
      }

      // 2. 크레딧 차감
      const useResponse = await axios.post(
        `${API_BASE_URL}/credits/use`,
        {
          amount: 5,
          description: `${chapterTitle} 읽기`,
          referenceType: 'CHAPTER',
          referenceId: chapterId,
        },
        {
          headers: { 'X-User-Id': getUserId() },
        }
      );

      // 3. 잠금 해제 상태 저장
      localStorage.setItem(`chapter-${chapterId}`, 'unlocked');
      setIsUnlocked(true);
      setCreditBalance(useResponse.data.data.balance);

      alert('챕터가 잠금 해제되었습니다!');
    } catch (error) {
      console.error('챕터 잠금 해제 실패:', error);
      alert('챕터 잠금 해제 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="credit-display">
        보유 크레딧: {creditBalance}점
      </div>

      {!isUnlocked ? (
        <div className="locked-chapter">
          <h2>{chapterTitle}</h2>
          <p>이 챕터를 읽으려면 5 크레딧이 필요합니다.</p>
          <button onClick={unlockChapter} disabled={loading}>
            {loading ? '처리 중...' : '5 크레딧 사용하고 읽기'}
          </button>
        </div>
      ) : (
        <div className="chapter-content">
          <h2>{chapterTitle}</h2>
          {/* 실제 챕터 콘텐츠 렌더링 */}
          <p>챕터 내용...</p>
        </div>
      )}
    </div>
  );
}

function getUserId(): string {
  return localStorage.getItem('userId') || 'test-user-id';
}
```

---

## 에러 처리

### 공통 에러 응답 형식
```json
{
  "code": 400,
  "status": "ERROR",
  "message": "크레딧 잔액이 부족합니다. 현재: 2, 필요: 5",
  "data": null
}
```

### 주요 에러 코드

| HTTP 코드 | 설명 | 처리 방법 |
|-----------|------|-----------|
| 400 | 잘못된 요청 (유효성 검증 실패) | 요청 파라미터 확인 |
| 401 | 인증 실패 | 로그인 페이지로 리디렉션 |
| 403 | 권한 없음 | 에러 메시지 표시 |
| 404 | 리소스 없음 | 목록 페이지로 이동 |
| 409 | 충돌 (잔액 부족, 중복 요청 등) | 에러 메시지 표시 및 재시도 옵션 제공 |
| 500 | 서버 오류 | "일시적인 오류입니다" 메시지 표시 |

### 에러 처리 예시
```typescript
// utils/api.ts
import axios, { AxiosError } from 'axios';

export const handleApiError = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponse<null>>;

    if (axiosError.response) {
      const { code, message } = axiosError.response.data;

      switch (code) {
        case 401:
          // 인증 실패
          window.location.href = '/login';
          break;
        case 409:
          // 비즈니스 로직 에러 (크레딧 부족 등)
          alert(message);
          break;
        case 500:
          // 서버 에러
          alert('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          break;
        default:
          alert(message || '오류가 발생했습니다.');
      }
    } else {
      // 네트워크 에러
      alert('네트워크 연결을 확인해주세요.');
    }
  }
};
```

### 크레딧 부족 에러 처리
```typescript
try {
  await axios.post(`${API_BASE_URL}/credits/use`, ...);
} catch (error) {
  if (axios.isAxiosError(error) && error.response?.status === 409) {
    const message = error.response.data.message;

    if (message.includes('부족')) {
      const confirmCharge = window.confirm(
        '크레딧이 부족합니다. 충전하시겠습니까?'
      );

      if (confirmCharge) {
        router.push('/credits/charge');
      }
    }
  }
}
```

---

## UI/UX 가이드라인

### 1. 크레딧 표시

#### 실시간 잔액 표시
모든 페이지 헤더에 크레딧 잔액을 표시하세요.

```typescript
// components/CreditBadge.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export function CreditBadge() {
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    fetchBalance();

    // 5초마다 잔액 갱신 (선택사항)
    const interval = setInterval(fetchBalance, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchBalance = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/credits`, {
        headers: { 'X-User-Id': getUserId() },
      });
      setBalance(response.data.data.balance);
    } catch (error) {
      console.error('크레딧 조회 실패:', error);
    }
  };

  return (
    <div className="credit-badge">
      <span className="icon">💰</span>
      <span className="balance">{balance}</span>
      <span className="label">크레딧</span>
    </div>
  );
}
```

#### 권장 디자인
- **위치**: 헤더 우측 상단
- **색상**: 눈에 잘 띄는 골드/옐로우 계열
- **아이콘**: 동전, 별, 다이아몬드 등
- **클릭 시**: 크레딧 상세 페이지 또는 충전 페이지로 이동

### 2. 패키지 선택 화면

#### 권장 레이아웃
```
┌─────────────────────────────────────────────┐
│            크레딧 충전하기                     │
├─────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐     │
│  │ 100점   │  │ 500점   │  │ 1000점  │     │
│  │         │  │  [인기]  │  │         │     │
│  │ 1,000원 │  │ 5,000원 │  │ 10,000원│     │
│  │         │  │ +50보너스│  │+150보너스│    │
│  └─────────┘  └─────────┘  └─────────┘     │
└─────────────────────────────────────────────┘
```

#### 디자인 팁
- 인기 패키지에 배지 표시 (`isPopular: true`)
- 보너스 크레딧은 눈에 띄게 강조
- 호버 시 확대 효과
- 선택 시 테두리 강조

### 3. 챕터 잠금/해제 UI

#### 잠금 상태
```
┌──────────────────────────────────────┐
│  🔒 1편 1챕터                         │
│                                      │
│  이 챕터를 읽으려면 5 크레딧이 필요합니다. │
│                                      │
│  [5 크레딧 사용하고 읽기]              │
│                                      │
│  현재 보유: 550 크레딧                 │
└──────────────────────────────────────┘
```

#### 잠금 해제 후
```
┌──────────────────────────────────────┐
│  ✅ 1편 1챕터                         │
│                                      │
│  [챕터 내용 전체 표시]                 │
│                                      │
└──────────────────────────────────────┘
```

### 4. 로딩 상태

모든 API 호출 시 로딩 상태를 표시하세요.

```typescript
{loading && <div className="spinner">처리 중...</div>}
```

### 5. 성공/실패 피드백

- **성공**: 토스트 메시지 또는 모달로 "550 크레딧이 충전되었습니다!" 표시
- **실패**: 명확한 에러 메시지와 재시도 버튼 제공

---

## 테스트

### 테스트 카드 정보

토스 페이먼츠 테스트 환경에서 사용 가능한 카드:

| 카드사 | 카드번호 | 유효기간 | CVC | 비밀번호 |
|--------|----------|----------|-----|----------|
| 신한카드 | 5412-8456-1234-1234 | 12/28 | 123 | 1234 |
| 삼성카드 | 5412-8456-5678-5678 | 12/28 | 456 | 5678 |

또는 토스 페이먼츠 결제창에서 "**테스트 결제**" 옵션 선택

### 테스트 시나리오

#### 1. 정상 결제 플로우
1. `/credits/charge` 페이지 접속
2. 패키지 선택 (예: 500점 패키지)
3. 결제창에서 테스트 카드 입력
4. 결제 완료 후 `/payments/success`로 리디렉션
5. 크레딧 550점 자동 충전 확인

#### 2. 크레딧 사용 플로우
1. 챕터 페이지 접속
2. "5 크레딧 사용하고 읽기" 버튼 클릭
3. 크레딧 5점 차감 확인
4. 챕터 잠금 해제 확인

#### 3. 크레딧 부족 시나리오
1. 크레딧 잔액 3점으로 설정
2. 챕터 읽기 시도 (5점 필요)
3. "크레딧이 부족합니다" 모달 표시
4. 충전 페이지로 이동 옵션 제공

#### 4. 결제 취소 플로우
1. 결제창에서 "취소" 버튼 클릭
2. `/payments/fail`로 리디렉션
3. 에러 메시지 표시 확인

---

## 체크리스트

프론트엔드 개발 완료 전 체크리스트:

### 환경 설정
- [ ] 토스 페이먼츠 SDK 설치
- [ ] 환경 변수 설정 (API URL, 클라이언트 키)
- [ ] API 클라이언트 (Axios) 설정

### 크레딧 충전 기능
- [ ] 크레딧 패키지 목록 조회 API 연동
- [ ] 결제 준비 API 연동
- [ ] 토스 결제 위젯 렌더링
- [ ] 결제 성공 페이지 구현 (`/payments/success`)
- [ ] 결제 승인 API 호출
- [ ] 결제 실패 페이지 구현 (`/payments/fail`)
- [ ] 로딩 상태 처리
- [ ] 에러 처리

### 크레딧 사용 기능
- [ ] 크레딧 잔액 조회 API 연동
- [ ] 실시간 크레딧 잔액 표시 (헤더)
- [ ] 크레딧 사용 가능 여부 확인 API 연동
- [ ] 크레딧 사용 API 연동 (챕터 잠금 해제)
- [ ] 크레딧 부족 시 충전 안내 모달
- [ ] 챕터 잠금/해제 UI 구현

### 거래 내역
- [ ] 크레딧 거래 내역 조회 API 연동
- [ ] 페이지네이션 구현
- [ ] 타입별 필터링 (CHARGE, USE, REFUND)

### UI/UX
- [ ] 크레딧 잔액 배지 디자인
- [ ] 패키지 선택 카드 디자인
- [ ] 챕터 잠금 UI 디자인
- [ ] 로딩 스피너
- [ ] 성공/실패 토스트 메시지

### 테스트
- [ ] 정상 결제 플로우 테스트
- [ ] 크레딧 사용 플로우 테스트
- [ ] 크레딧 부족 시나리오 테스트
- [ ] 결제 취소 플로우 테스트
- [ ] 에러 케이스 테스트

### 보안
- [ ] API 호출 시 인증 헤더 포함
- [ ] 환경 변수로 민감 정보 관리
- [ ] HTTPS 사용 (프로덕션)

---

## 추가 참고 자료

### 토스 페이먼츠 공식 문서
- [결제 위젯 연동 가이드](https://docs.tosspayments.com/guides/payment-widget/integration)
- [결제창 연동 가이드](https://docs.tosspayments.com/guides/payment-window/integration)
- [테스트 카드 정보](https://docs.tosspayments.com/reference/test-card)
- [SDK 레퍼런스](https://docs.tosspayments.com/reference/widget-sdk)

### 백엔드 문서
- **PAYMENT_SYSTEM_README.md**: 전체 시스템 개요
- **PAYMENT_API_GUIDE.md**: 상세 API 가이드
- **TECHNICAL_DOCUMENTATION.md**: 기술 문서

---

## 문의

구현 중 문제가 발생하면 백엔드 개발자에게 문의하세요:

- API 응답 형식 관련
- 에러 코드 의미
- 비즈니스 로직 확인
- 추가 기능 요청

---

**작성일**: 2026-01-04
**버전**: 1.0.0
**백엔드 API 버전**: v1
