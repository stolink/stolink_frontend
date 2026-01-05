export const VISUAL_TRANSLATION_MAP: Record<string, string> = {
  // Occupations / Roles
  Knight: "기사",
  Wizard: "마법사",
  Mage: "마법사",
  Sorcerer: "소서러",
  Archer: "궁수",
  Warrior: "전사",
  Cleric: "성직자",
  Priest: "사제",
  Thief: "도적",
  Rogue: "로그",
  Paladin: "성기사",
  King: "왕",
  Queen: "여왕",
  Prince: "왕자",
  Princess: "공주",
  Noble: "귀족",
  Merchant: "상인",
  Hunter: "사냥꾼",
  Assassin: "암살자",
  Soldier: "병사",
  Captain: "대장",
  Commander: "지휘관",
  Student: "학생",
  Teacher: "선생님",
  Doctor: "의사",
  Nurse: "간호사",
  Detective: "탐정",
  Police: "경찰",

  // Personality Traits
  Brave: "용감함",
  Courageous: "용기 있음",
  Cowardly: "겁이 많음",
  Kind: "친절함",
  Cruel: "잔인함",
  Smart: "똑똑함",
  Intelligent: "지적임",
  Wise: "지혜로움",
  Foolish: "어리석음",
  Calm: "침착함",
  "Hot-tempered": "다혈질",
  Cheerful: "쾌활함",
  Gloomy: "우울함",
  Loyal: "충직함",
  Honest: "정직함",
  Liar: "거짓말쟁이",
  Ambitious: "야망 있음",
  Greedy: "탐욕스러움",
  Generous: "관대함",
  Selfish: "이기적임",
  Introverted: "내향적",
  Extroverted: "외향적",
  Serious: "진지함",
  Playful: "장난기 많음",
  Curious: "호기심 많음",
  Cautious: "신중함",
  Confident: "자신감 넘침",
  Shy: "수줍음 많음",
  Stubborn: "고집 셈",
  Flexible: "융통성 있음",
  Lazy: "게으름",
  Diligent: "성실함",
  Optimistic: "낙관적",
  Pessimistic: "비관적",
  Romantic: "낭만적",
  Realistic: "현실적",

  Impulsive: "충동적",
  Compassionate: "동정심 많음",

  // Colors
  Red: "빨간색",
  Blue: "파란색",
  Green: "초록색",
  Black: "검정색",
  White: "흰색",
  Gold: "금색",
  Silver: "은색",
  Brown: "갈색",
  Blonde: "금발",
  Gray: "회색",
  Purple: "보라색",
  Pink: "분홍색",
  Yellow: "노란색",
  Ash: "재색",
  Crimson: "진홍색",
  Azure: "하늘색",
  Navy: "남색",
  Beige: "베이지색",

  // Physique / Body Type
  Slender: "날씬함",
  Athletic: "탄탄함",
  Muscular: "근육질",
  Chubby: "통통함",
  Petite: "아담함",
  Tall: "키가 큼",
  Robust: "건장함",
  Slim: "슬림함",
  Curvy: "볼륨감 있음",
  Lean: "마름",
  Average: "보통",

  // Hair Style
  Long: "긴 머리",
  Short: "짧은 머리",
  Curly: "곱슬머리",
  Wavy: "웨이브",
  Straight: "직모",
  Ponytail: "포니테일",
  Braided: "땋은 머리",
  Bald: "대머리",
  Bob: "단발",
  Messy: "헝클어진 머리",

  // Skin Tone
  Pale: "창백함",
  Fair: "밝음",
  Tanned: "태닝됨",
  Dark: "어두움",
  Olive: "올리브색",
  Rough: "거침",
  Smooth: "매끄러움",

  // Eyes / Expression
  Round: "동그람",
  Sharp: "날카로움",
  Almond: "아몬드형",
  Gentle: "온화함",
  Fierce: "사나움",
  Cold: "차가움",
  Warm: "따뜻함",

  // Clothing / Style
  Casual: "캐주얼",
  Formal: "정장",
  Armor: "갑옷",
  Robe: "로브",
  Uniform: "유니폼",
  Dress: "드레스",
  Suit: "수트",
  Vintage: "빈티지",
  Modern: "모던",
  Fantasy: "판타지풍",
};

export function translateVisualValue(value: string): string {
  if (!value) return "";

  // 1. Exact match
  if (VISUAL_TRANSLATION_MAP[value]) {
    return VISUAL_TRANSLATION_MAP[value];
  }

  // 2. Case-insensitive match
  const capitalize = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const cappedVal = capitalize(value);
  if (VISUAL_TRANSLATION_MAP[cappedVal]) {
    return VISUAL_TRANSLATION_MAP[cappedVal];
  }

  // 3. Word-by-word replacement (Simple)
  // 문장형일 경우 단어 단위로 치환 시도 (ex: "Long Black Hair" -> "긴 검은 헤어")
  const words = value.split(" ");
  if (words.length > 1) {
    const translatedWords = words.map((word) => {
      // Remove punctuation for lookup
      const cleanWord = word.replace(/[,.]/g, "");
      const translated =
        VISUAL_TRANSLATION_MAP[capitalize(cleanWord)] ||
        VISUAL_TRANSLATION_MAP[cleanWord];
      return translated ? translated + (word.endsWith(",") ? "," : "") : word;
    });

    // 만약 절반 이상 번역되었다면 번역된 문장 반환, 아니면 원본 반환 (어색함 방지)
    const translatedCount = translatedWords.filter(
      (w, i) => w !== words[i],
    ).length;
    if (translatedCount > 0) {
      return translatedWords.join(" ");
    }
  }

  return value;
}
