/**
 * 인물 일대기 목데이터 (API 응답 구조)
 */
import type { BiographyEvent } from "@/types/biography";

export const MOCK_BIOGRAPHY_EVENTS: BiographyEvent[] = [
  {
    eventId: "E001",
    eventType: "encounter",
    narrativeSummary: "운명적인 첫 만남",
    description:
      "폭풍우가 몰아치는 밤, 숲속 오두막에서 두 사람이 처음 만났다. 서로를 경계하면서도 묘한 끌림을 느꼈다.",
    participants: ["리안", "엘라"],
    locationRef: "Dark Forest Cabin",
    prevEventId: null,
    visualScene:
      "A stormy night, two silhouettes facing each other in a dimly lit cabin",
    timestamp: null,
    importance: 8,
    changesMade: null,
  },
  {
    eventId: "E002",
    eventType: "conflict",
    narrativeSummary: "오래된 적과의 재회",
    description:
      "과거의 원수가 나타나 마을을 위협했다. 리안은 마을 사람들을 지키기 위해 검을 들었다.",
    participants: ["리안", "다크로드"],
    locationRef: "Village Square",
    prevEventId: "E001",
    visualScene:
      "A tense standoff between a young warrior and a dark figure in the village square",
    timestamp: null,
    importance: 9,
    changesMade: null,
  },
  {
    eventId: "E003",
    eventType: "revelation",
    narrativeSummary: "숨겨진 혈통의 비밀",
    description:
      "고대 문서를 통해 자신이 잃어버린 왕국의 마지막 후예임을 알게 되었다. 모든 것이 달라졌다.",
    participants: ["리안", "현자 마리온"],
    locationRef: "Ancient Library",
    prevEventId: "E002",
    visualScene:
      "A young man reading an ancient scroll, his face illuminated by candlelight, expression of shock",
    timestamp: null,
    importance: 10,
    changesMade: null,
  },
  {
    eventId: "E004",
    eventType: "decision",
    narrativeSummary: "왕좌를 포기하다",
    description:
      "권력보다 소중한 것이 있음을 깨달았다. 왕좌를 물려받는 대신 자신만의 길을 선택했다.",
    participants: ["리안"],
    locationRef: "Throne Room",
    prevEventId: "E003",
    visualScene:
      "A figure turning away from an ornate throne, walking towards the light of an open door",
    timestamp: null,
    importance: 9,
    changesMade: null,
  },
  {
    eventId: "E005",
    eventType: "action",
    narrativeSummary: "티오의 반란과 리안 구출 시도",
    description:
      "티오가 베라의 계획에 반기를 들고, 자신의 거대한 가방을 베라에게 던져 리안을 구출하는 기회를 만든다. 마법 공구와 폭약들이 바닥에 흩어진다.",
    participants: ["리안", "베라", "티오"],
    locationRef: "Underground Sacred Temple",
    prevEventId: "E004",
    visualScene:
      "A young boy throwing a massive bag at a dark sorceress, magical tools scattering",
    timestamp: null,
    importance: 9,
    changesMade: null,
  },
  {
    eventId: "E006",
    eventType: "dialogue",
    narrativeSummary: "진심을 고백하다",
    description:
      "오랜 망설임 끝에 마음속 깊은 이야기를 나누었다. 서로의 상처와 희망을 공유했다.",
    participants: ["리안", "엘라"],
    locationRef: "Moonlit Garden",
    prevEventId: "E005",
    visualScene:
      "Two figures sitting close together in a moonlit garden, sharing quiet words",
    timestamp: null,
    importance: 7,
    changesMade: null,
  },
  {
    eventId: "E007",
    eventType: "transformation",
    narrativeSummary: "각성, 숨겨진 힘의 발현",
    description:
      "절체절명의 순간, 내면에 잠들어 있던 고대의 마법이 깨어났다. 더 이상 예전의 자신이 아니었다.",
    participants: ["리안"],
    locationRef: "Battlefield",
    prevEventId: "E006",
    visualScene:
      "A warrior surrounded by ethereal light, ancient symbols glowing on their skin",
    timestamp: null,
    importance: 10,
    changesMade: null,
  },
  {
    eventId: "E008",
    eventType: "resolution",
    narrativeSummary: "최종 결전의 승리",
    description:
      "긴 여정의 끝, 마침내 어둠을 물리치고 평화를 되찾았다. 희생이 없지 않았지만, 새로운 시대가 열렸다.",
    participants: ["리안", "엘라", "티오", "다크로드"],
    locationRef: "Dark Fortress",
    prevEventId: "E007",
    visualScene:
      "A triumphant hero standing atop a crumbling dark fortress, sunrise in the background",
    timestamp: null,
    importance: 10,
    changesMade: null,
  },
];
