// Sample documents for demo/testing
import type { Document } from "@/types/document";

export const SAMPLE_PROJECT_ID = "sample-project-001";

// Sample document contents
export const SAMPLE_DOCUMENT_CONTENTS: Record<string, string> = {
  "doc-sample-1-1": `
<h1>프롤로그: 잊혀진 왕국</h1>
<p>천년 전, 하늘과 땅 사이에 <strong>아르카디아</strong>라는 왕국이 있었다.</p>
<p>그 왕국은 마법과 기술이 조화롭게 공존하는 곳이었으며, 모든 종족이 평화롭게 살아가는 유토피아였다.</p>
<p>하지만 어느 날, <em>대균열</em>이 일어났다. 하늘이 갈라지고 어둠이 쏟아져 내렸다.</p>
<p>왕국은 하룻밤 사이에 사라졌고, 사람들의 기억 속에서도 점점 잊혀져 갔다.</p>
`,
  "doc-sample-1-2": `
<h1>1장: 이상한 꿈</h1>
<p>서윤은 또 그 꿈을 꾸었다.</p>
<p>하늘에 떠 있는 성, 빛나는 탑, 그리고 자신을 부르는 누군가의 목소리.</p>
<p>"돌아와... 너는 반드시..."</p>
<p>잠에서 깬 서윤은 이마에 맺힌 땀을 닦았다.</p>
`,
  "doc-sample-1-3": `
<h1>2장: 수상한 전학생</h1>
<p>새 학기 첫날, 교실에 전학생이 들어왔다.</p>
<p>은색 머리카락에 보랏빛 눈. 어딘가 이 세상 사람이 아닌 것 같은 분위기.</p>
<p>"안녕하세요. <strong>카엘</strong>이라고 합니다."</p>
`,
  "doc-sample-2-1": `
<h1>3장: 비밀의 문</h1>
<p>학교 도서관 깊숙한 곳, 아무도 가지 않는 서고가 있었다.</p>
<p>서윤은 카엘의 뒤를 따라 그곳으로 들어갔다.</p>
<p>"아르카디아로 가는 관문이야. 네가 원래 있어야 할 곳."</p>
`,
  "doc-sample-2-2": `
<h1>4장: 잃어버린 기억</h1>
<p>관문을 통과한 순간, 서윤의 머릿속에 수많은 이미지가 스쳐갔다.</p>
<p>"너는 아르카디아의 마지막 공주야, <strong>세레니아</strong>."</p>
`,
  "doc-sample-2-3": `
<h1>5장: 새로운 힘</h1>
<p>아르카디아에 발을 디딘 순간, 서윤의 몸에서 빛이 뿜어져 나왔다.</p>
<p>"지금부터 네가 배워야 할 것들이 많아. 이 세계를 구하려면."</p>
`,
  "doc-sample-3-1": `
<h1>6장: 어둠의 세력</h1>
<p>그날 밤, 검은 그림자들이 마을을 습격했다.</p>
<p>서윤은 처음으로 실전을 경험했다.</p>
`,
  "doc-sample-3-2": `
<h1>7장: 과거의 진실</h1>
<p>고대 도서관에서 서윤은 천년 전의 기록을 발견했다.</p>
<p>"대균열은... 왕가의 배신자가 일으킨 거였어?"</p>
`,
  "doc-sample-3-3": `
<h1>8장: 동료들</h1>
<p>혼자서는 이길 수 없다는 것을 깨달은 서윤은 동료를 모으기 시작했다.</p>
<p>"이제 우리는 <em>별의 수호자</em>야."</p>
`,
  "doc-sample-4-1": `
<h1>9장: 최후의 결전</h1>
<p>드디어 마르쿠스의 성에 도착했다.</p>
<p>"동료들이여, 함께가자. 아르카디아를 되찾을 때야!"</p>
<p>최후의 전투가 시작되었다.</p>
`,
};

// Sample documents - hierarchical structure
export const SAMPLE_DOCUMENTS: Document[] = [
  // Part 1
  {
    id: "doc-part-1",
    projectId: SAMPLE_PROJECT_ID,
    type: "folder",
    title: "제1부: 시작의 장",
    content: "",
    synopsis: "주인공 서윤의 일상과 운명적인 만남",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Chapter 1
  {
    id: "doc-chapter-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-part-1",
    type: "folder",
    title: "챕터 1: 각성",
    content: "",
    synopsis: "서윤의 이상한 꿈과 전학생 카엘",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Sections under Chapter 1
  {
    id: "doc-sample-1-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-1",
    type: "text",
    title: "프롤로그: 잊혀진 왕국",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-1-1"],
    synopsis: "천년 전 사라진 아르카디아 왕국의 이야기",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 312,
      includeInCompile: true,
      keywords: ["프롤로그", "아르카디아"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-1-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-1",
    type: "text",
    title: "1장: 이상한 꿈",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-1-2"],
    synopsis: "서윤이 반복해서 꾸는 신비로운 꿈",
    order: 1,
    metadata: {
      status: "draft",
      wordCount: 187,
      includeInCompile: true,
      keywords: ["꿈", "서윤"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-1-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-1",
    type: "text",
    title: "2장: 수상한 전학생",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-1-3"],
    synopsis: "카엘의 등장과 기묘한 기시감",
    order: 2,
    metadata: {
      status: "draft",
      wordCount: 198,
      includeInCompile: true,
      keywords: ["카엘", "전학생"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Part 2
  {
    id: "doc-part-2",
    projectId: SAMPLE_PROJECT_ID,
    type: "folder",
    title: "제2부: 아르카디아",
    content: "",
    synopsis: "새로운 세계로의 여정",
    order: 1,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Chapter 2
  {
    id: "doc-chapter-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-part-2",
    type: "folder",
    title: "챕터 2: 비밀의 세계",
    content: "",
    synopsis: "관문 통과와 정체성 발견",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-2-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-2",
    type: "text",
    title: "3장: 비밀의 문",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-2-1"],
    synopsis: "도서관의 숨겨진 관문",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 175,
      includeInCompile: true,
      keywords: ["관문"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-2-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-2",
    type: "text",
    title: "4장: 잃어버린 기억",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-2-2"],
    synopsis: "공주 세레니아로서의 정체성",
    order: 1,
    metadata: {
      status: "draft",
      wordCount: 168,
      includeInCompile: true,
      keywords: ["기억", "공주"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-2-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-2",
    type: "text",
    title: "5장: 새로운 힘",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-2-3"],
    synopsis: "마법의 각성",
    order: 2,
    metadata: {
      status: "draft",
      wordCount: 156,
      includeInCompile: true,
      keywords: ["마법", "힘"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Part 3
  {
    id: "doc-part-3",
    projectId: SAMPLE_PROJECT_ID,
    type: "folder",
    title: "제3부: 전쟁",
    content: "",
    synopsis: "어둠과의 대결",
    order: 2,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-chapter-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-part-3",
    type: "folder",
    title: "챕터 3: 대결",
    content: "",
    synopsis: "진실의 발견과 동료 모집",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-3-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-3",
    type: "text",
    title: "6장: 어둠의 세력",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-3-1"],
    synopsis: "그림자 병사들의 습격",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 145,
      includeInCompile: true,
      keywords: ["전투"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-3-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-3",
    type: "text",
    title: "7장: 과거의 진실",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-3-2"],
    synopsis: "대균열의 원인 발견",
    order: 1,
    metadata: {
      status: "draft",
      wordCount: 152,
      includeInCompile: true,
      keywords: ["진실", "기록"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-3-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-3",
    type: "text",
    title: "8장: 동료들",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-3-3"],
    synopsis: "별의 수호자 결성",
    order: 2,
    metadata: {
      status: "draft",
      wordCount: 139,
      includeInCompile: true,
      keywords: ["동료", "팀"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Part 4
  {
    id: "doc-part-4",
    projectId: SAMPLE_PROJECT_ID,
    type: "folder",
    title: "제4부: 결말",
    content: "",
    synopsis: "최종 대결",
    order: 3,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-chapter-4",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-part-4",
    type: "folder",
    title: "챕터 4: 최후의 전투",
    content: "",
    synopsis: "마르쿠스와의 대결",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 0,
      includeInCompile: true,
      keywords: [],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "doc-sample-4-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "doc-chapter-4",
    type: "text",
    title: "9장: 최후의 결전",
    content: SAMPLE_DOCUMENT_CONTENTS["doc-sample-4-1"],
    synopsis: "아르카디아 탈환 작전",
    order: 0,
    metadata: {
      status: "draft",
      wordCount: 163,
      includeInCompile: true,
      keywords: ["결전", "마르쿠스"],
      notes: "",
    },
    characterIds: [],
    foreshadowingIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize sample data in document store
export function initializeSampleDocuments(): void {
  const { documents, _create } = useDocumentStore.getState();

  // Check if already initialized
  if (
    Object.values(documents).some((doc) => doc.projectId === SAMPLE_PROJECT_ID)
  ) {
    return;
  }

  SAMPLE_DOCUMENTS.forEach((doc) => _create(doc));
}

// Re-export for convenience
import { useDocumentStore } from "@/repositories/LocalDocumentRepository";
