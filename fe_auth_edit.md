비동기 원고 처리 시스템 구현 계획
목표
원고 업로드 시 즉시 응답(202 Accepted)을 반환하고, 백그라운드에서 비동기로 원고를 파싱/분할하여 프론트엔드에서 진행률을 확인할 수 있도록 합니다.

백엔드 구현 사항

1. Job 엔티티 생성
   파일:
   ManuscriptJob.java

@Entity
public class ManuscriptJob {
@Id
private UUID id;
@ManyToOne
private Project project;
@Enumerated(EnumType.STRING)
private JobStatus status; // PENDING, PROCESSING, COMPLETED, FAILED
private int progress; // 0-100
private String message; // "챕터 분석 중...", "5,000자 분할 중..."
private int totalDocuments; // 생성된 문서 수
private LocalDateTime createdAt;
private LocalDateTime completedAt;
} 2. API 엔드포인트 수정
원고 업로드 (즉시 응답)
POST /api/projects/{pid}/manuscript/upload
Response: 202 Accepted
{
"success": true,
"data": {
"jobId": "uuid",
"status": "PENDING",
"message": "원고 업로드가 시작되었습니다."
}
}
작업 상태 폴링
GET /api/jobs/{jobId}
Response: 200 OK
{
"success": true,
"data": {
"jobId": "uuid",
"status": "PROCESSING", // PENDING, PROCESSING, COMPLETED, FAILED
"progress": 45,
"message": "5,000자 분할 중... (3/7)",
"totalDocuments": 3,
"completedAt": null
}
} 3. 비동기 처리 (Spring @Async)
@Async
public void processManuscriptAsync(UUID jobId, UUID userId, ManuscriptUploadRequest request) {
// 1. Job 상태를 PROCESSING으로 변경
// 2. 원고 파싱 실행 (진행률 업데이트)
// 3. 완료 시 Job 상태를 COMPLETED로 변경
}
프론트엔드 구현 사항

1. 원고 업로드 흐름
   // 1. 원고 업로드 요청 → 즉시 jobId 반환
   const { jobId } = await api.post(`/projects/${pid}/manuscript/upload`, {
   content,
   });
   // 2. 프로젝트 목록에서 해당 프로젝트를 "처리 중" 상태로 표시
   setProjectStatus(pid, { isProcessing: true, jobId, progress: 0 });
2. 폴링으로 진행률 확인
   // 2초마다 상태 확인
   const pollInterval = setInterval(async () => {
   const { status, progress, message, totalDocuments } = await api.get(
   `/jobs/${jobId}`
   );
   setProjectStatus(pid, { progress, message });
   if (status === "COMPLETED") {
   clearInterval(pollInterval);
   setProjectStatus(pid, { isProcessing: false });
   showNotification(
   `서재 준비 완료! ${totalDocuments}개 섹션이 생성되었습니다.`
   );
   } else if (status === "FAILED") {
   clearInterval(pollInterval);
   setProjectStatus(pid, { isProcessing: false, error: message });
   }
   }, 2000);
3. 라이브러리 UI (책 카드 위 프로그레스 바)
   function ProjectCard({ project }) {
   const { isProcessing, progress, message } = useProjectStatus(project.id);
   return (
   <div className="project-card">
   {isProcessing && (
   <div className="processing-overlay">
   <ProgressBar value={progress} />
   <span className="status-message">{message}</span>
   </div>
   )}
   <img src={project.coverImage} />
   <h3>{project.title}</h3>
   </div>
   );
   }
   구현 순서
   현재 동기 방식 API 분석 완료

ManuscriptJob
엔티티 및 Repository 생성

ManuscriptJobService
생성 (비동기 처리 로직)

DocumentController
수정 (202 응답, jobId 반환)
폴링 엔드포인트 (/api/jobs/{jobId}) 추가
진행률 업데이트 로직 구현
백엔드 배포 완료
프론트엔드 체크리스트
원고 업로드 시 jobId 저장 (localStorage 또는 Zustand)
2초 간격 폴링 구현 (또는 React Query refetchInterval)
ProjectCard에 프로그레스 오버레이 추가
완료/실패 시 토스트 알림 표시
페이지 이동해도 폴링 유지 (전역 상태 관리)
