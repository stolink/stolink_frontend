/**
 * Publish Types
 * 커뮤니티 배포 및 Draft 관련 타입 정의
 */

// 관계도 노드 (D3 렌더링용)
export interface GraphNode {
  id: string; // 캐릭터 UUID
  name: string; // 표시 이름
  role: string; // protagonist, supporting 등 (색상 결정)
  group?: string; // 소속/팩션 (클러스터링용)
  imageUrl?: string; // 노드 이미지
}

// 관계도 간선
export interface GraphLink {
  source: string; // 출발 노드 ID
  target: string; // 도착 노드 ID
  id: string; // 링크 고유 ID (source-target)
  type: string; // friendly, hostile 등 (선 스타일)
  strength: number; // 1~10 (선 굵기)
  description?: string; // 관계 설명
  history?: string | null; // 관계 히스토리 (간선 클릭 시 표시, 현재는 문자열)
}

// 캐릭터 상세 프로필 (노드 클릭 시 표시)
export interface ProfileSnapshot {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  personality?: string[]; // 핵심 성격 키워드
  backstory?: string;
  imageUrl?: string;
}

// Draft 생성 요청 (API RequestBody)
export interface CreateDraftRequest {
  documentId: string; // 필수: 배포할 섹션 ID
  projectId: string; // 필수: 원본 프로젝트 ID (독자 서비스에서 프로젝트 식별용)
  title: string; // 섹션 제목
  content: string; // HTML 본문
  graphSnapshot: {
    nodes: GraphNode[];
    links: GraphLink[];
    profiles: Record<string, ProfileSnapshot>;
  };
  // Work(작품) 정보 - 독자 서비스에서 작품 생성 시 사용
  workTitle?: string; // 작품 제목 (프로젝트 제목)
  workSynopsis?: string; // 작품 소개 (프로젝트 설명)
  workGenre?: string; // 작품 장르 (fantasy, romance 등)
  workCoverUrl?: string; // 작품 표지 이미지 URL
}

// Draft 응답
export interface Draft {
  id: string;
  createdAt: string;
  expiresAt: string;
}

// 배포 완료된 게시글 (참고용, 현재 프론트에서 직접 사용하진 않음)
export interface PublishedPost {
  id: string;
  publishedUrl: string;
  publishedAt: string;
  status: "published" | "draft";
}
