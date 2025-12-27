// Sample data for logged-in users (not demo mode)
import type { Chapter } from "@/types/chapter";

export const SAMPLE_PROJECT_ID = "sample-project-001";

// Sample chapter contents - 10 sections with rich content
export const SAMPLE_CHAPTER_CONTENTS: Record<string, string> = {
  "sample-1-1": `
<h1>프롤로그: 잊혀진 왕국</h1>
<p>천년 전, 하늘과 땅 사이에 <strong>아르카디아</strong>라는 왕국이 있었다.</p>
<p>그 왕국은 마법과 기술이 조화롭게 공존하는 곳이었으며, 모든 종족이 평화롭게 살아가는 유토피아였다.</p>
<p>하지만 어느 날, <em>대균열</em>이 일어났다. 하늘이 갈라지고 어둠이 쏟아져 내렸다.</p>
<p>왕국은 하룻밤 사이에 사라졌고, 사람들의 기억 속에서도 점점 잊혀져 갔다.</p>
<p>그리고 천년이 지난 지금, 그 왕국의 흔적이 다시 나타나기 시작했다...</p>
`,
  "sample-1-2": `
<h1>1장: 이상한 꿈</h1>
<p>서윤은 또 그 꿈을 꾸었다.</p>
<p>하늘에 떠 있는 성, 빛나는 탑, 그리고 자신을 부르는 누군가의 목소리.</p>
<p>"돌아와... 너는 반드시..."</p>
<p>잠에서 깬 서윤은 이마에 맺힌 땀을 닦았다. 이 꿈은 일주일째 계속되고 있었다.</p>
<p><strong>"오늘도 그 꿈이었어?"</strong></p>
<p>룸메이트 지호가 걱정스러운 눈으로 물었다.</p>
<p>"응... 점점 더 선명해지는 것 같아."</p>
`,
  "sample-1-3": `
<h1>2장: 수상한 전학생</h1>
<p>새 학기 첫날, 교실에 전학생이 들어왔다.</p>
<p>은색 머리카락에 보랏빛 눈. 어딘가 이 세상 사람이 아닌 것 같은 분위기.</p>
<p>"안녕하세요. <strong>카엘</strong>이라고 합니다."</p>
<p>그의 시선이 서윤에게 닿는 순간, 서윤은 알 수 없는 기시감을 느꼈다.</p>
<p><em>'이 사람... 어디서 본 것 같은데?'</em></p>
<p>카엘은 마치 오래전부터 서윤을 알고 있었다는 듯이 미소 지었다.</p>
`,
  "sample-2-1": `
<h1>3장: 비밀의 문</h1>
<p>학교 도서관 깊숙한 곳, 아무도 가지 않는 서고가 있었다.</p>
<p>서윤은 카엘의 뒤를 따라 그곳으로 들어갔다.</p>
<p>"여기가 뭐하는 곳인데?"</p>
<p>"잠시 후면 알게 될 거야."</p>
<p>카엘이 고서 하나를 빼자, 벽이 갈라지며 빛나는 문이 나타났다.</p>
<p><strong>"이게... 뭐야?!"</strong></p>
<p>"아르카디아로 가는 관문이야. 네가 원래 있어야 할 곳."</p>
`,
  "sample-2-2": `
<h1>4장: 잃어버린 기억</h1>
<p>관문을 통과한 순간, 서윤의 머릿속에 수많은 이미지가 스쳐갔다.</p>
<p>하늘을 나는 용, 마법을 쓰는 사람들, 그리고... 왕관을 쓴 자신의 모습.</p>
<p>"기억나?"</p>
<p>"나는... 누구였던 거야?"</p>
<p>"너는 아르카디아의 마지막 공주야, <strong>세레니아</strong>."</p>
<p>서윤은 다리에 힘이 풀렸다. 말도 안 되는 이야기였지만, 마음 한구석에서는 이것이 진실이라고 속삭이고 있었다.</p>
`,
  "sample-2-3": `
<h1>5장: 새로운 힘</h1>
<p>아르카디아에 발을 디딘 순간, 서윤의 몸에서 빛이 뿜어져 나왔다.</p>
<p>"이건... 마법?"</p>
<p>"네 안에 잠들어 있던 힘이 깨어나는 거야."</p>
<p>손끝에서 작은 불꽃이 피어올랐다. 서윤은 경이로움과 두려움이 뒤섞인 감정을 느꼈다.</p>
<p><em>'이게 정말 나의 힘이라고?'</em></p>
<p>카엘이 진지한 표정으로 말했다.</p>
<p><strong>"지금부터 네가 배워야 할 것들이 많아. 이 세계를 구하려면."</strong></p>
`,
  "sample-3-1": `
<h1>6장: 어둠의 세력</h1>
<p>그날 밤, 검은 그림자들이 마을을 습격했다.</p>
<p>"<strong>그림자 병사</strong>들이야! 모두 대피해!"</p>
<p>서윤은 처음으로 실전을 경험했다. 손에서 뿜어져 나오는 마법은 불안정했지만, 그래도 싸울 수 있었다.</p>
<p>"잘하고 있어. 집중해!"</p>
<p>카엘이 옆에서 엄호해주었다. 함께 싸우는 동안, 서윤은 조금씩 자신감을 얻어갔다.</p>
<p><em>'나에게도 할 수 있는 일이 있어.'</em></p>
`,
  "sample-3-2": `
<h1>7장: 과거의 진실</h1>
<p>고대 도서관에서 서윤은 천년 전의 기록을 발견했다.</p>
<p>"대균열은... 왕가의 배신자가 일으킨 거였어?"</p>
<p>기록에 따르면, 왕의 측근이었던 <strong>마르쿠스</strong>가 금지된 마법을 사용해 왕국을 멸망시켰다.</p>
<p>"그리고 그 마르쿠스가... 아직 살아있어."</p>
<p>카엘의 말에 서윤의 얼굴이 창백해졌다.</p>
<p>"천년을 어떻게?"</p>
<p>"어둠의 힘으로 영생을 얻었거든. 그리고 그가 다시 움직이기 시작했어."</p>
`,
  "sample-3-3": `
<h1>8장: 동료들</h1>
<p>혼자서는 이길 수 없다는 것을 깨달은 서윤은 동료를 모으기 시작했다.</p>
<p><strong>리나</strong> - 치유 마법을 쓰는 엘프</p>
<p><strong>드레이크</strong> - 검술의 달인인 드워프</p>
<p><strong>루시</strong> - 정보를 수집하는 도적</p>
<p>각자 다른 이유로 마르쿠스에게 원한을 품고 있었고, 서윤과 함께 싸우기로 했다.</p>
<p>"이제 우리는 <em>별의 수호자</em>야."</p>
<p>서윤이 선언했다. 비록 작은 팀이었지만, 그들의 눈에는 결의가 빛나고 있었다.</p>
`,
  "sample-4-1": `
<h1>9장: 최후의 결전</h1>
<p>드디어 마르쿠스의 성에 도착했다.</p>
<p>검은 성은 하늘 높이 솟아 있었고, 주변에는 검은 기운이 소용돌이치고 있었다.</p>
<p>"여기까지 오다니... 제법이군, <strong>공주</strong>."</p>
<p>마르쿠스의 목소리가 울려 퍼졌다.</p>
<p>서윤은 검을 꽉 쥐었다.</p>
<p><em>'두렵지 않아. 나는 더 이상 도망치지 않을 거야.'</em></p>
<p>"동료들이여, 함께가자. 아르카디아를 되찾을 때야!"</p>
<p>최후의 전투가 시작되었다.</p>
`,
};

// Sample chapters structure
export const SAMPLE_CHAPTERS: Chapter[] = [
  {
    id: "sample-part-1",
    projectId: SAMPLE_PROJECT_ID,
    title: "제1부: 시작의 장",
    content: "",
    order: 0,
    type: "part",
    characterCount: 0,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-chapter-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-part-1",
    title: "챕터 1: 각성",
    content: "",
    order: 0,
    type: "chapter",
    characterCount: 0,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-1-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-1",
    title: "프롤로그: 잊혀진 왕국",
    content: SAMPLE_CHAPTER_CONTENTS["sample-1-1"],
    order: 0,
    type: "section",
    characterCount: 312,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-1-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-1",
    title: "1장: 이상한 꿈",
    content: SAMPLE_CHAPTER_CONTENTS["sample-1-2"],
    order: 1,
    type: "section",
    characterCount: 287,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-1-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-1",
    title: "2장: 수상한 전학생",
    content: SAMPLE_CHAPTER_CONTENTS["sample-1-3"],
    order: 2,
    type: "section",
    characterCount: 298,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-part-2",
    projectId: SAMPLE_PROJECT_ID,
    title: "제2부: 아르카디아",
    content: "",
    order: 1,
    type: "part",
    characterCount: 0,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-chapter-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-part-2",
    title: "챕터 2: 비밀의 세계",
    content: "",
    order: 0,
    type: "chapter",
    characterCount: 0,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-2-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-2",
    title: "3장: 비밀의 문",
    content: SAMPLE_CHAPTER_CONTENTS["sample-2-1"],
    order: 0,
    type: "section",
    characterCount: 275,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-2-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-2",
    title: "4장: 잃어버린 기억",
    content: SAMPLE_CHAPTER_CONTENTS["sample-2-2"],
    order: 1,
    type: "section",
    characterCount: 310,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-2-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-2",
    title: "5장: 새로운 힘",
    content: SAMPLE_CHAPTER_CONTENTS["sample-2-3"],
    order: 2,
    type: "section",
    characterCount: 289,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-part-3",
    projectId: SAMPLE_PROJECT_ID,
    title: "제3부: 전쟁",
    content: "",
    order: 2,
    type: "part",
    characterCount: 0,
    isPlot: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-chapter-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-part-3",
    title: "챕터 3: 대결",
    content: "",
    order: 0,
    type: "chapter",
    characterCount: 0,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-3-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-3",
    title: "6장: 어둠의 세력",
    content: SAMPLE_CHAPTER_CONTENTS["sample-3-1"],
    order: 0,
    type: "section",
    characterCount: 295,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-3-2",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-3",
    title: "7장: 과거의 진실",
    content: SAMPLE_CHAPTER_CONTENTS["sample-3-2"],
    order: 1,
    type: "section",
    characterCount: 302,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-3-3",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-3",
    title: "8장: 동료들",
    content: SAMPLE_CHAPTER_CONTENTS["sample-3-3"],
    order: 2,
    type: "section",
    characterCount: 285,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-part-4",
    projectId: SAMPLE_PROJECT_ID,
    title: "제4부: 결말",
    content: "",
    order: 3,
    type: "part",
    characterCount: 0,
    isPlot: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-chapter-4",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-part-4",
    title: "챕터 4: 최후의 전투",
    content: "",
    order: 0,
    type: "chapter",
    characterCount: 0,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "sample-4-1",
    projectId: SAMPLE_PROJECT_ID,
    parentId: "sample-chapter-4",
    title: "9장: 최후의 결전",
    content: SAMPLE_CHAPTER_CONTENTS["sample-4-1"],
    order: 0,
    type: "section",
    characterCount: 320,
    isPlot: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Initialize sample data in stores
export function initializeSampleData(
  chapterStore: {
    chapters: Record<string, Chapter>;
    createChapter: (input: {
      projectId: string;
      title: string;
      type: string;
      parentId?: string;
      extras?: Record<string, unknown>;
    }) => string;
  },
  getChaptersByProject: (projectId: string) => Chapter[],
): void {
  // Check if sample data already exists
  const existingChapters = getChaptersByProject(SAMPLE_PROJECT_ID);
  if (existingChapters.length > 0) {
    return;
  }

  // Add all sample chapters to the store
  SAMPLE_CHAPTERS.forEach((chapter) => {
    // Directly set in store (bypass createChapter to preserve IDs)
    chapterStore.chapters[chapter.id] = chapter;
  });
}
