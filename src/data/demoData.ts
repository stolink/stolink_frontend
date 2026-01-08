import type { TourStep } from "@/components/common/GuidedTour";

export const DEMO_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="chapter-tree"]',
    title: "📚 챕터 관리",
    content:
      "부, 장, 절 단위로 스토리를 체계적으로 구성하세요. 클릭하면 해당 챕터로 이동합니다.",
    placement: "right",
  },
  {
    target: '[data-tour="editor"]',
    title: "✍️ 에디터",
    content:
      "마크다운을 지원하는 리치 텍스트 에디터입니다. #복선:태그명 형식으로 복선을 표시하세요.",
    placement: "bottom",
  },
  {
    target: '[data-tour="foreshadowing-panel"]',
    title: "🔮 복선 관리",
    content:
      "AI가 감지한 복선을 추적하고, 회수 여부를 관리합니다. 미회수 복선을 한눈에 확인하세요.",
    placement: "left",
  },
  {
    target: '[data-tour="ai-panel"]',
    title: "🤖 AI 어시스턴트",
    content: "캐릭터 대사 톤 맞추기, 플롯 제안 등 AI가 집필을 도와드립니다.",
    placement: "left",
  },
  {
    target: '[data-tour="world-tab"]',
    title: "🌍 세계관 관리",
    content:
      "캐릭터 관계도, 장소, 아이템 등 세계관 정보를 시각적으로 관리하세요.",
    placement: "bottom",
  },
];

// 데모용 챕터별 컨텐츠
export const DEMO_CHAPTER_CONTENTS: Record<string, string> = {
  "chapter-1-1": `
<h1>1.1 운명의 밤</h1>
<p>달빛이 창문을 통해 작은 방을 비춘다. 이건우는 아버지의 유품인 검을 바라보며 깊은 생각에 잠겼다.</p>
<p>"이 검은 네 운명을 바꿀 것이다." <mark data-color="#E8EFE8">#복선:월영검</mark></p>
<p>15년 전, 가문이 몰살당하던 그날 밤. 어린 건우는 어둠 속에서 붉은 눈을 가진 존재를 보았다. 그 기억은 여전히 악몽으로 찾아왔다.</p>
<p>"카이로스..." <mark data-color="#E8EFE8">#복선:카이로스의정체</mark></p>
<p>현자 가온이 말했다. 세상에는 보이지 않는 전쟁이 벌어지고 있다고. 그리고 건우가 그 전쟁의 핵심이 될 것이라고.</p>
<p>하지만 지금 건우에게는 한 가지 목표만 있었다. 가족의 원수를 찾는 것.</p>
`,
  "chapter-1-2": `
<h1>1.2 첫 만남</h1>
<p>마을 입구에서 낯선 여인이 서 있었다. 은빛 머리카락이 바람에 흩날리고 있었다.</p>
<p>"당신이... 이건우인가요?" <mark data-color="#E8EFE8">#복선:아린의과거</mark></p>
<p>여인은 자신을 아린이라고 소개했다. 정령의 숲에서 온 엘프라고 했다.</p>
<p>"저도 찾고 있는 것이 있어요. 세계수의 씨앗... 혹시 들어본 적 있으신가요?"</p>
<p>건우는 고개를 저었다. 하지만 어딘가에서 그 이름을 들어본 것 같은 기묘한 느낌이 들었다.</p>
<p>"함께 가시겠어요? 우리의 목적지가 같을지도 몰라요."</p>
`,
  "chapter-1-3": `
<h1>1.3 여정의 시작</h1>
<p>아린이 활을 어깨에 걸치며 다가왔다.</p>
<p>"정령의 숲으로 가야 해요. 거기서 세계수의 씨앗에 대한 단서를 찾을 수 있을 거예요."</p>
<p>건우는 고개를 끄덕였다. 두 사람의 목적은 달랐지만, 지금은 함께 가는 것이 옳았다.</p>
<p>마을을 떠나기 전, 현자 가온이 건우를 불렀다.</p>
<p>"이것을 가져가거라." 가온은 작은 부적을 건넸다. <mark data-color="#E8EFE8">#복선:가온의부적</mark></p>
<p>"위험할 때 이것이 너를 지켜줄 것이다. 하지만... 대가가 있다는 것을 기억해라."</p>
`,
  "chapter-2-1": `
<h1>2.1 금지된 숲</h1>
<p>숲의 입구에 도착했을 때, 아린의 표정이 굳어졌다.</p>
<p>"이상해요... 정령들의 기운이 느껴지지 않아요."</p>
<p>원래 이 숲은 정령들로 가득 찬 곳이었다. 하지만 지금은 죽은 듯이 고요했다.</p>
<p>숲 깊숙이 들어가자, 검게 타버린 나무들이 나타났다. <mark data-color="#E8EFE8">#복선:숲의황폐화</mark></p>
<p>"누가... 누가 이런 짓을..."</p>
<p>아린의 눈에 눈물이 고였다. 이곳은 한때 그녀의 고향이었다.</p>
`,
  "chapter-2-2": `
<h1>2.2 과거의 그림자</h1>
<p>폐허가 된 마을 중앙에서, 그들은 오래된 비석을 발견했다.</p>
<p>"100년 전의 대재앙... 여기서 시작되었군요." <mark data-color="#E8EFE8">#복선:100년전사건</mark></p>
<p>건우는 비석에 새겨진 문양을 보고 숨을 멈췄다. 그것은 그의 가문 문장과 똑같았다.</p>
<p>"이건... 왜 우리 가문의 문장이..."</p>
<p>아린이 조심스럽게 말했다. "당신 가문과 이 재앙 사이에 연관이 있는 것 같아요."</p>
<p>건우의 머릿속이 복잡해졌다. 가족을 죽인 원수를 찾아 떠난 여정이, 예상치 못한 방향으로 흘러가고 있었다.</p>
`,
  "chapter-3-1": `
<h1>3.1 암흑의 군주</h1>
<p>숲의 가장 깊은 곳, 검은 안개가 자욱한 곳에서 그가 나타났다.</p>
<p>"오랜만이구나, 월영검의 계승자여." <mark data-color="#E8EFE8">#복선:카이로스의정체</mark></p>
<p>카이로스. 15년 전 그날 밤, 가족을 죽인 원수.</p>
<p>건우의 손이 검자루를 움켜쥐었다.</p>
<p>"드디어 만났군. 오늘 여기서 끝내겠다."</p>
<p>하지만 카이로스는 웃기만 했다. "끝? 이건 시작일 뿐이다. 네가 아직 모르는 진실이 많아."</p>
`,
};

// 데모용 챕터 트리 구조
export const DEMO_CHAPTERS = [
  {
    id: "chapter-demo-1",
    projectId: "demo",
    title: "제1부: 운명의 시작",
    content: "",
    order: 1,
    type: "chapter" as const,
    characterCount: 0,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-1",
    projectId: "demo",
    parentId: "chapter-demo-1",
    title: "제1장: 만남",
    content: "",
    order: 1,
    type: "chapter" as const,
    characterCount: 0,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-1-1",
    projectId: "demo",
    parentId: "chapter-1",
    title: "1.1 운명의 밤",
    content: DEMO_CHAPTER_CONTENTS["chapter-1-1"],
    order: 1,
    type: "section" as const,
    characterCount: 412,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-1-2",
    projectId: "demo",
    parentId: "chapter-1",
    title: "1.2 첫 만남",
    content: DEMO_CHAPTER_CONTENTS["chapter-1-2"],
    order: 2,
    type: "section" as const,
    characterCount: 358,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-1-3",
    projectId: "demo",
    parentId: "chapter-1",
    title: "1.3 여정의 시작",
    content: DEMO_CHAPTER_CONTENTS["chapter-1-3"],
    order: 3,
    type: "section" as const,
    characterCount: 385,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-2",
    projectId: "demo",
    parentId: "chapter-demo-1",
    title: "제2장: 정령의 숲",
    content: "",
    order: 2,
    type: "chapter" as const,
    characterCount: 0,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-2-1",
    projectId: "demo",
    parentId: "chapter-2",
    title: "2.1 금지된 숲",
    content: DEMO_CHAPTER_CONTENTS["chapter-2-1"],
    order: 1,
    type: "section" as const,
    characterCount: 342,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-2-2",
    projectId: "demo",
    parentId: "chapter-2",
    title: "2.2 과거의 그림자",
    content: DEMO_CHAPTER_CONTENTS["chapter-2-2"],
    order: 2,
    type: "section" as const,
    characterCount: 398,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-demo-2",
    projectId: "demo",
    title: "제2부: 진실",
    content: "",
    order: 2,
    type: "chapter" as const,
    characterCount: 0,
    isPlot: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-3",
    projectId: "demo",
    parentId: "chapter-demo-2",
    title: "제3장: 대적",
    content: "",
    order: 1,
    type: "chapter" as const,
    characterCount: 0,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-3-1",
    projectId: "demo",
    parentId: "chapter-3",
    title: "3.1 암흑의 군주",
    content: DEMO_CHAPTER_CONTENTS["chapter-3-1"],
    order: 1,
    type: "section" as const,
    characterCount: 365,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

// 초기 표시될 데모 컨텐츠 (첫 번째 섹션)
export const DEMO_NOVEL_CONTENT = DEMO_CHAPTER_CONTENTS["chapter-1-1"];

// =====================================================
// 데모용 캐릭터 데이터 (10명) - 새 스키마
// =====================================================
import type { Character } from "@/types";

// 헬퍼: 빈 기본 구조 생성
const createDefaultCharacter = (
  overrides: Partial<Character> & {
    _id: string;
    profile: Character["profile"];
  }
): Character => ({
  _id: overrides._id,
  projectId: overrides.projectId || "demo-project-id",
  role: overrides.role || "supporting",
  profile: overrides.profile,
  aliases: overrides.aliases || [],
  status: overrides.status || "active",
  appearance: overrides.appearance || {
    physique: "",
    skinTone: "",
    eyes: "",
    nose: "",
    mouth: "",
    hairStyle: "",
    hairColor: "",
    attire: [],
    expression: "",
    scarsTattoos: [],
    styleContext: { artStyle: "realistic" },
  },
  personality: overrides.personality || {
    coreTraits: [],
    flaws: [],
    values: [],
  },
  relations: overrides.relations || {
    graph: [],
    eventRefs: [],
    locationContext: "",
  },
  currentMood: overrides.currentMood || {
    emotion: "neutral",
    intensity: 5,
    trigger: null,
  },
  inventory: overrides.inventory || [],
  meta: overrides.meta || {
    createdAt: null,
    updatedAt: null,
    dataVersion: "1.0",
    lockVersion: 0,
  },
  imageUrl: overrides.imageUrl,
});

export const DEMO_CHARACTERS: Character[] = [
  createDefaultCharacter({
    _id: "char-1",
    role: "protagonist",
    // 테스트용 샘플 이미지 (Unsplash placeholder)
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    profile: {
      characterId: "char-1",
      name: "장발장 (Jean Valjean)",
      age: 50,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["자비로움", "강인함", "희생적"],
        flaws: ["과거의 죄책감"],
        values: ["구원", "희생"],
      },
      backstory:
        "빵 한 조각을 훔친 죄로 19년간 복역한 후, 미리엘 주교의 감화로 새 삶을 살기로 결심한 인물.",
      faction: {
        name: "선한자들",
        social: { rank: "시장", influence: 9, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["자비로움", "강인함"],
      flaws: ["과거의 죄책감"],
      values: ["구원", "희생"],
    },
  }),
  createDefaultCharacter({
    _id: "char-2",
    role: "antagonist",
    profile: {
      characterId: "char-2",
      name: "자베르 (Javert)",
      age: 45,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["집요함", "원칙주의", "냉철함"],
        flaws: ["융통성 부족"],
        values: ["법과 질서"],
      },
      backstory:
        "법과 질서를 맹신하며, 장발장을 평생 쫓는 형사. 법 앞에는 예외가 없다고 믿는다.",
      faction: {
        name: "법집행국",
        social: { rank: "경감", influence: 7, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["집요함", "원칙주의"],
      flaws: ["융통성 부족"],
      values: ["법과 질서"],
    },
  }),
  createDefaultCharacter({
    _id: "char-3",
    role: "supporting",
    profile: {
      characterId: "char-3",
      name: "팡틴 (Fantine)",
      age: 25,
      gender: "여성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["모성애", "비극적", "순수함"],
        flaws: ["나약함"],
        values: ["딸을 위한 희생"],
      },
      backstory:
        "코제트를 부양하기 위해 모든 것을 희생하는 어머니. 사회의 부조리에 짓밟힌 비운의 여인.",
      faction: {
        name: "빈민",
        social: { rank: "노동자", influence: 1, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["모성애", "순수함"],
      flaws: ["나약함"],
      values: ["딸을 위한 희생"],
    },
  }),
  createDefaultCharacter({
    _id: "char-4",
    role: "protagonist",
    profile: {
      characterId: "char-4",
      name: "코제트 (Cosette)",
      age: 18,
      gender: "여성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["순수함", "희망적", "사랑스러움"],
        flaws: ["세상 물정에 어두움"],
        values: ["사랑", "가족"],
      },
      backstory:
        "팡틴의 딸이자 장발장의 양녀. 어두운 과거를 뒤로하고 마리우스와 사랑에 빠진다.",
      faction: {
        name: "선한자들",
        social: { rank: "양녀", influence: 3, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["순수함", "희망적"],
      flaws: ["세상 물정에 어두움"],
      values: ["사랑", "가족"],
    },
  }),
  createDefaultCharacter({
    _id: "char-5",
    role: "protagonist",
    profile: {
      characterId: "char-5",
      name: "마리우스 (Marius)",
      age: 20,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["이상주의", "열정적", "로맨틱"],
        flaws: ["우유부단"],
        values: ["자유", "사랑"],
      },
      backstory:
        "공화주의 사상을 가진 청년. 혁명에 가담하지만 코제트와의 사랑으로 갈등한다.",
      faction: {
        name: "ABC의 벗",
        social: { rank: "회원", influence: 5, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["이상주의", "열정"],
      flaws: ["우유부단"],
      values: ["자유", "사랑"],
    },
  }),
  createDefaultCharacter({
    _id: "char-6",
    role: "supporting",
    profile: {
      characterId: "char-6",
      name: "에포닌 (Éponine)",
      age: 18,
      gender: "여성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["희생적", "질투", "비극적"],
        flaws: ["짝사랑의 집착"],
        values: ["진정한 사랑"],
      },
      backstory:
        "테나르디에 부부의 딸. 어린 시절 코제트를 괴롭혔으나, 나중에 마리우스를 사랑하여 그를 위해 희생한다.",
      faction: {
        name: "테나르디에 일가",
        social: { rank: "딸", influence: 2, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["희생적", "용감"],
      flaws: ["짝사랑의 집착"],
      values: ["진정한 사랑"],
    },
  }),
  createDefaultCharacter({
    _id: "char-7",
    role: "supporting",
    profile: {
      characterId: "char-7",
      name: "앙졸라 (Enjolras)",
      age: 22,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["카리스마", "냉철함", "이상주의"],
        flaws: ["감정 배제"],
        values: ["자유", "평등"],
      },
      backstory:
        "아베쎄(ABC) 벗들의 리더. 혁명에 자신의 모든 것을 바치는 열정적인 지도자.",
      faction: {
        name: "ABC의 벗",
        social: { rank: "리더", influence: 8, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["카리스마", "단호함"],
      flaws: ["감정 배제"],
      values: ["자유", "평등"],
    },
  }),
  createDefaultCharacter({
    _id: "char-8",
    role: "antagonist",
    profile: {
      characterId: "char-8",
      name: "테나르디에 (Thénardier)",
      age: 50,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["탐욕스러움", "비열함", "기회주의"],
        flaws: ["탐욕"],
        values: ["돈", "자기 이익"],
      },
      backstory:
        "돈을 위해서라면 무슨 짓이든 하는 악당. 워털루 전쟁 때 장교를 구했다는 거짓말로 훈장을 받았다.",
      faction: {
        name: "테나르디에 일가",
        social: { rank: "가장", influence: 4, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["교활함", "생존본능"],
      flaws: ["탐욕"],
      values: ["돈", "자기 이익"],
    },
  }),
  createDefaultCharacter({
    _id: "char-9",
    role: "sidekick",
    profile: {
      characterId: "char-9",
      name: "가브로슈 (Gavroche)",
      age: 12,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["용감함", "자유분방", "명랑함"],
        flaws: ["무모함"],
        values: ["자유", "우정"],
      },
      backstory:
        "파리의 부랑아. 테나르디에의 버려진 아들이며, 혁명군을 돕다 전사한다.",
      faction: {
        name: "파리 거리",
        social: { rank: "부랑아", influence: 2, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["용감함", "명랑함"],
      flaws: ["무모함"],
      values: ["자유", "우정"],
    },
  }),
  createDefaultCharacter({
    _id: "char-10",
    role: "mentor",
    profile: {
      characterId: "char-10",
      name: "미리엘 주교 (Bishop Myriel)",
      age: 75,
      gender: "남성",
      race: "인간",
      mbti: null,
      personality: {
        coreTraits: ["성자", "자비로움", "검소함"],
        flaws: [],
        values: ["신앙", "용서", "구원"],
      },
      backstory:
        "디뉴의 주교. 장발장에게 은촛대를 주며 그를 구원하고 정직한 삶으로 인도한다.",
      faction: {
        name: "성직자",
        social: { rank: "주교", influence: 8, factionReputation: {} },
      },
    },
    personality: {
      coreTraits: ["자비로움", "검소함"],
      flaws: [],
      values: ["신앙", "용서", "구원"],
    },
  }),
];

// =====================================================
// 데모용 아이템 데이터 (레미제라블) - 기능 제거됨
// =====================================================
export interface DemoItem {
  id: string;
  name: string;
  type: string;
  extras?: {
    설명?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export const DEMO_ITEMS: DemoItem[] = [];
