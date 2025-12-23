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
    id: "part-1",
    projectId: "demo",
    title: "제1부: 운명의 시작",
    content: "",
    order: 1,
    type: "part" as const,
    characterCount: 0,
    isPlot: false,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-1",
    projectId: "demo",
    parentId: "part-1",
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
    parentId: "part-1",
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
    id: "part-2",
    projectId: "demo",
    title: "제2부: 진실",
    content: "",
    order: 2,
    type: "part" as const,
    characterCount: 0,
    isPlot: true,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "chapter-3",
    projectId: "demo",
    parentId: "part-2",
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
// 데모용 캐릭터 데이터 (10명)
// =====================================================
import type { Character } from "@/types";

export const DEMO_CHARACTERS: Character[] = [
  {
    id: "char-1",
    projectId: "demo",
    name: "장발장 (Jean Valjean)",
    role: "protagonist",
    imageUrl: "https://randomuser.me/api/portraits/men/50.jpg",
    extras: {
      나이: 50,
      성별: "남성",
      직업: "전과자 / 시장 / 기업가",
      성격: ["자비로움", "강인함", "희생적"],
      설명: "빵 한 조각을 훔친 죄로 19년간 복역한 후, 미리엘 주교의 감화로 새 삶을 살기로 결심한 인물.",
      관계: [
        "자베르 (추적자)",
        "팡틴 (구원 대상)",
        "코제트 (양녀)",
        "마리우스 (사위)",
      ],
      등장: ["1.1 주교의 은촛대", "1.2 마들렌 시장", "2.1 코제트 구출"],
      진행률: 80,
    },
    createdAt: "2024-01-01",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-2",
    projectId: "demo",
    name: "자베르 (Javert)",
    role: "antagonist",
    imageUrl: "https://randomuser.me/api/portraits/men/3.jpg",
    extras: {
      나이: 45,
      성별: "남성",
      직업: "경감",
      성격: ["집요함", "원칙주의", "냉철함"],
      설명: "법과 질서를 맹신하며, 장발장을 평생 쫓는 형사. 법 앞에는 예외가 없다고 믿는다.",
      관계: ["장발장 (표적)", "팡틴 (체포 대상)"],
      등장: ["1.2 마들렌 시장", "2.3 바리케이드"],
      진행률: 60,
    },
    createdAt: "2024-01-02",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-3",
    projectId: "demo",
    name: "팡틴 (Fantine)",
    role: "supporting",
    imageUrl: "https://randomuser.me/api/portraits/women/68.jpg",
    extras: {
      나이: 25,
      성별: "여성",
      직업: "공장 직공",
      성격: ["모성애", "비극적", "순수함"],
      설명: "코제트를 부양하기 위해 모든 것을 희생하는 어머니. 사회의 부조리에 짓밟힌 비운의 여인.",
      관계: ["장발장 (은인)", "코제트 (딸)", "자베르 (공포의 대상)"],
      등장: ["1.2 마들렌 시장"],
      진행률: 100,
    },
    createdAt: "2024-01-03",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-4",
    projectId: "demo",
    name: "코제트 (Cosette)",
    role: "protagonist",
    imageUrl: "https://randomuser.me/api/portraits/women/42.jpg",
    extras: {
      나이: 18,
      성별: "여성",
      직업: "없음",
      성격: ["순수함", "희망적", "사랑스러움"],
      설명: "팡틴의 딸이자 장발장의 양녀. 어두운 과거를 뒤로하고 마리우스와 사랑에 빠진다.",
      관계: [
        "장발장 (양아버지)",
        "팡틴 (어머니)",
        "마리우스 (연인)",
        "에포닌 (라이벌)",
      ],
      등장: ["2.1 코제트 구출", "2.2 사랑의 시작", "3.1 결혼식"],
      진행률: 50,
    },
    createdAt: "2024-01-04",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-5",
    projectId: "demo",
    name: "마리우스 (Marius)",
    role: "protagonist",
    imageUrl: "https://randomuser.me/api/portraits/men/86.jpg",
    extras: {
      나이: 20,
      성별: "남성",
      직업: "변호사 / 혁명가",
      성격: ["이상주의", "열정적", "로맨틱"],
      설명: "공화주의 사상을 가진 청년. 혁명에 가담하지만 코제트와의 사랑으로 갈등한다.",
      관계: [
        "코제트 (연인)",
        "장발장 (장인)",
        "앙졸라 (동지)",
        "에포닌 (짝사랑받음)",
      ],
      등장: ["2.2 사랑의 시작", "2.3 바리케이드", "3.1 결혼식"],
      진행률: 70,
    },
    createdAt: "2024-01-05",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-6",
    projectId: "demo",
    name: "에포닌 (Éponine)",
    role: "supporting",
    imageUrl: "https://randomuser.me/api/portraits/women/90.jpg",
    extras: {
      나이: 18,
      성별: "여성",
      직업: "빈민",
      성격: ["희생적", "질투", "비극적"],
      설명: "테나르디에 부부의 딸. 어린 시절 코제트를 괴롭혔으나, 나중에 마리우스를 사랑하여 그를 위해 희생한다.",
      관계: ["마리우스 (짝사랑)", "코제트 (질투/동경)", "테나르디에 (아버지)"],
      등장: ["2.2 사랑의 시작", "2.3 바리케이드"],
      진행률: 100,
    },
    createdAt: "2024-01-06",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-7",
    projectId: "demo",
    name: "앙졸라 (Enjolras)",
    role: "supporting",
    imageUrl: "https://randomuser.me/api/portraits/men/22.jpg",
    extras: {
      나이: 22,
      성별: "남성",
      직업: "혁명 리더",
      성격: ["카리스마", "냉철함", "이상주의"],
      설명: "아베쎄(ABC) 벗들의 리더. 혁명에 자신의 모든 것을 바치는 열정적인 지도자.",
      관계: ["마리우스 (동지)", "그랑테르 (추종자)"],
      등장: ["2.3 바리케이드"],
      진행률: 100,
    },
    createdAt: "2024-01-07",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-8",
    projectId: "demo",
    name: "테나르디에 (Thénardier)",
    role: "antagonist",
    imageUrl: "https://randomuser.me/api/portraits/men/55.jpg",
    extras: {
      나이: 50,
      성별: "남성",
      직업: "여관 주인 / 사기꾼",
      성격: ["탐욕스러움", "비열함", "기회주의"],
      설명: "돈을 위해서라면 무슨 짓이든 하는 악당. 워털루 전쟁 때 장교를 구했다는 거짓말로 훈장을 받았다.",
      관계: [
        "팡틴 (착취 대상)",
        "코제트 (학대 대상)",
        "장발장 (사기 대상)",
        "에포닌 (딸)",
      ],
      등장: ["1.2 마들렌 시장", "3.1 결혼식"],
      진행률: 60,
    },
    createdAt: "2024-01-08",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-9",
    projectId: "demo",
    name: "가브로슈 (Gavroche)",
    role: "sidekick",
    imageUrl: "https://randomuser.me/api/portraits/men/15.jpg",
    extras: {
      나이: 12,
      성별: "남성",
      직업: "거리의 아이",
      성격: ["용감함", "자유분방", "명랑함"],
      설명: "파리의 부랑아. 테나르디에의 버려진 아들이며, 혁명군을 돕다 전사한다.",
      관계: ["에포닌 (누나)", "앙졸라 (동지)", "마리우스 (동지)"],
      등장: ["2.3 바리케이드"],
      진행률: 100,
    },
    createdAt: "2024-01-09",
    updatedAt: "2024-12-20",
  },
  {
    id: "char-10",
    projectId: "demo",
    name: "미리엘 주교 (Bishop Myriel)",
    role: "mentor",
    imageUrl: "https://randomuser.me/api/portraits/men/9.jpg",
    extras: {
      나이: 75,
      성별: "남성",
      직업: "주교",
      성격: ["성자", "자비로움", "검소함"],
      설명: "디뉴의 주교. 장발장에게 은촛대를 주며 그를 구원하고 정직한 삶으로 인도한다.",
      관계: ["장발장 (구원자)"],
      등장: ["1.1 주교의 은촛대"],
      진행률: 100,
    },
    createdAt: "2024-01-10",
    updatedAt: "2024-12-20",
  },
];
