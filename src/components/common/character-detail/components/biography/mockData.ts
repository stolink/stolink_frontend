/**
 * 인물 일대기 목데이터 (API 응답 구조)
 */
import type { BiographyEvent } from "@/types/biography";

export const MOCK_BIOGRAPHY_EVENTS: BiographyEvent[] = [
  {
    event_id: "E001",
    event_type: "encounter",
    narrative_summary: "운명적인 첫 만남",
    description:
      "폭풍우가 몰아치는 밤, 숲속 오두막에서 두 사람이 처음 만났다. 서로를 경계하면서도 묘한 끌림을 느꼈다.",
    participants: ["리안", "엘라"],
    location_ref: "Dark Forest Cabin",
    prev_event_id: null,
    visual_scene:
      "A stormy night, two silhouettes facing each other in a dimly lit cabin",
    timestamp: null,
    importance: 8,
    changes_made: null,
  },
  {
    event_id: "E002",
    event_type: "conflict",
    narrative_summary: "오래된 적과의 재회",
    description:
      "과거의 원수가 나타나 마을을 위협했다. 리안은 마을 사람들을 지키기 위해 검을 들었다.",
    participants: ["리안", "다크로드"],
    location_ref: "Village Square",
    prev_event_id: "E001",
    visual_scene:
      "A tense standoff between a young warrior and a dark figure in the village square",
    timestamp: null,
    importance: 9,
    changes_made: null,
  },
  {
    event_id: "E003",
    event_type: "revelation",
    narrative_summary: "숨겨진 혈통의 비밀",
    description:
      "고대 문서를 통해 자신이 잃어버린 왕국의 마지막 후예임을 알게 되었다. 모든 것이 달라졌다.",
    participants: ["리안", "현자 마리온"],
    location_ref: "Ancient Library",
    prev_event_id: "E002",
    visual_scene:
      "A young man reading an ancient scroll, his face illuminated by candlelight, expression of shock",
    timestamp: null,
    importance: 10,
    changes_made: null,
  },
  {
    event_id: "E004",
    event_type: "decision",
    narrative_summary: "왕좌를 포기하다",
    description:
      "권력보다 소중한 것이 있음을 깨달았다. 왕좌를 물려받는 대신 자신만의 길을 선택했다.",
    participants: ["리안"],
    location_ref: "Throne Room",
    prev_event_id: "E003",
    visual_scene:
      "A figure turning away from an ornate throne, walking towards the light of an open door",
    timestamp: null,
    importance: 9,
    changes_made: null,
  },
  {
    event_id: "E005",
    event_type: "action",
    narrative_summary: "티오의 반란과 리안 구출 시도",
    description:
      "티오가 베라의 계획에 반기를 들고, 자신의 거대한 가방을 베라에게 던져 리안을 구출하는 기회를 만든다. 마법 공구와 폭약들이 바닥에 흩어진다.",
    participants: ["리안", "베라", "티오"],
    location_ref: "Underground Sacred Temple",
    prev_event_id: "E004",
    visual_scene:
      "A young boy throwing a massive bag at a dark sorceress, magical tools scattering",
    timestamp: null,
    importance: 9,
    changes_made: null,
  },
  {
    event_id: "E006",
    event_type: "dialogue",
    narrative_summary: "진심을 고백하다",
    description:
      "오랜 망설임 끝에 마음속 깊은 이야기를 나누었다. 서로의 상처와 희망을 공유했다.",
    participants: ["리안", "엘라"],
    location_ref: "Moonlit Garden",
    prev_event_id: "E005",
    visual_scene:
      "Two figures sitting close together in a moonlit garden, sharing quiet words",
    timestamp: null,
    importance: 7,
    changes_made: null,
  },
  {
    event_id: "E007",
    event_type: "transformation",
    narrative_summary: "각성, 숨겨진 힘의 발현",
    description:
      "절체절명의 순간, 내면에 잠들어 있던 고대의 마법이 깨어났다. 더 이상 예전의 자신이 아니었다.",
    participants: ["리안"],
    location_ref: "Battlefield",
    prev_event_id: "E006",
    visual_scene:
      "A warrior surrounded by ethereal light, ancient symbols glowing on their skin",
    timestamp: null,
    importance: 10,
    changes_made: null,
  },
  {
    event_id: "E008",
    event_type: "resolution",
    narrative_summary: "최종 결전의 승리",
    description:
      "긴 여정의 끝, 마침내 어둠을 물리치고 평화를 되찾았다. 희생이 없지 않았지만, 새로운 시대가 열렸다.",
    participants: ["리안", "엘라", "티오", "다크로드"],
    location_ref: "Dark Fortress",
    prev_event_id: "E007",
    visual_scene:
      "A triumphant hero standing atop a crumbling dark fortress, sunrise in the background",
    timestamp: null,
    importance: 10,
    changes_made: null,
  },
];
