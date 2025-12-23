import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from 'reactflow';
import type { Node, Edge, NodeProps } from 'reactflow';
import 'reactflow/dist/style.css';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, MapPin, Sword, Plus, X, ZoomIn, ZoomOut, Save, Filter } from 'lucide-react';
import CharacterDetailModal from '@/components/common/CharacterDetailModal';
import type { Character, CharacterRole } from '@/types';
import { cn } from '@/lib/utils';

// 관계 타입 정의
type RelationType = 'friendship' | 'conflict' | 'romance' | 'family' | 'neutral';

const relationshipColors: Record<RelationType, string> = {
  friendship: '#22c55e', // 초록
  conflict: '#ef4444',   // 빨강
  romance: '#ec4899',    // 핑크
  family: '#1f2937',     // 검정
  neutral: '#9ca3af',    // 회색 (점선용)
};

const relationshipLabels: Record<RelationType, string> = {
  friendship: '우정',
  conflict: '갈등',
  romance: '로맨스',
  family: '가족',
  neutral: '중립',
};

// Custom Character Node - reference 디자인 반영
function CharacterNode({ data, selected }: NodeProps) {
  const isProtagonist = data.role === 'protagonist';
  const isDimmed = data.dimmed; // 필터링 시 블러 처리
  const isHighlighted = data.highlighted; // 필터링 시 하이라이트

  // 역할별 노드 크기
  const nodeSize = isProtagonist ? 'w-24 h-24' : 'w-16 h-16';
  const avatarPx = isProtagonist ? 96 : 64; // px 값

  return (
    <div className={cn(
      "relative group flex flex-col items-center gap-2 transition-all duration-300",
      isDimmed && "opacity-20 blur-[1px] pointer-events-none",
      isHighlighted && "scale-110"
    )}>
      {/* 원형 아바타 */}
      <div
        className={cn(
          'relative rounded-full bg-white flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer',
          nodeSize,
          isProtagonist
            ? 'border-4 border-blue-500 shadow-xl hover:scale-105'
            : 'border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:scale-105',
          selected && 'ring-4 ring-blue-300',
          isHighlighted && 'ring-4 ring-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]'
        )}
      >
        {/* Handles 위치를 아바타 중심에 맞춤 */}
        <Handle
          type="target"
          position={Position.Left}
          className="!opacity-0 !w-2 !h-2"
          style={{ left: -4, top: avatarPx / 2 }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!opacity-0 !w-2 !h-2"
          style={{ right: -4, top: avatarPx / 2 }}
        />

        {data.image ? (
          <img
            src={data.image}
            alt={data.name}
            className={cn(
              "w-full h-full object-cover transition-all duration-300",
              !isHighlighted && "grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100",
              isHighlighted && "grayscale-0 opacity-100"
            )}
          />
        ) : (
          <span className={cn(
            'transition-all',
            isProtagonist ? 'text-3xl' : 'text-2xl'
          )}>
            {data.role === 'protagonist' ? '🦸' :
             data.role === 'antagonist' ? '🦹' :
             data.role === 'mentor' ? '🧙' : '👤'}
          </span>
        )}
      </div>

      {/* 이름 라벨 */}
      <div className={cn(
        'whitespace-nowrap px-3 py-1 rounded-full text-xs font-bold shadow-md',
        isProtagonist
          ? 'bg-slate-900 text-white tracking-wide'
          : 'bg-white text-slate-800 border border-slate-200',
        isHighlighted && 'bg-yellow-400 text-slate-900 border-yellow-500'
      )}>
        {data.name}
      </div>
    </div>
  );
}

const nodeTypes = {
  character: CharacterNode,
};

// Mock Character Data - LangGraph/Neo4j에서 파싱된 데이터 형태
const mockCharacters: Character[] = [
  {
    id: '1',
    projectId: 'project-1',
    name: '이건우',
    role: 'protagonist',
    extras: {
      // 기본 정보
      '나이': '25세',
      '성별': '남성',
      '종족': '인간',
      '직업': '떠돌이 검객',
      '출신지': '북부 왕국 알카디아',
      '신분': '몰락한 귀족 가문의 후예',
      // 외형
      '키': '182cm',
      '체형': '균형 잡힌 근육질',
      '머리색': '검은색',
      '눈색': '짙은 갈색, 전투 시 붉게 변함',
      '외모 특징': '왼쪽 눈썹에 작은 흉터',
      // 성격
      '성격': '과묵하지만 정의감이 강함',
      'MBTI': 'ISTJ',
      '가치관': '약속은 반드시 지킨다',
      '두려움': '소중한 사람을 잃는 것',
      '좋아하는 것': '조용한 새벽, 검 손질',
      // 능력
      '주 무기': '아버지의 유품인 고검 "월영"',
      '전투 스타일': '빠른 일격필살형',
      '특수 능력': '월광검 - 달빛 아래 검의 힘이 증폭',
      '약점': '대규모 마법 공격에 취약',
      // 배경
      '과거 트라우마': '7살에 가족이 몰살당하는 것을 목격',
      '어린시절': '스승 가온에게 거두어져 검술 수련',
      // 관계
      '아린과의 관계': '서로 신뢰하는 동료, 미묘한 감정',
      '카이로스와의 관계': '가족을 죽인 원수',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-20T14:30:00Z',
  },
  {
    id: '2',
    projectId: 'project-1',
    name: '아린 실버리프',
    role: 'sidekick',
    extras: {
      // 기본 정보
      '나이': '150세 (엘프 기준 청년)',
      '성별': '여성',
      '종족': '하이엘프',
      '직업': '숲의 수호자',
      '출신지': '정령의 숲 엘라실',
      // 외형
      '키': '168cm',
      '머리색': '은백색',
      '눈색': '에메랄드빛 녹색',
      '외모 특징': '왼쪽 귀에 정령석 귀걸이',
      // 성격
      '성격': '차분하고 지혜로우나 때론 장난기도',
      'MBTI': 'INFJ',
      '가치관': '모든 생명은 소중하다',
      '취미': '별 관측, 약초 채집',
      // 능력
      '주 무기': '엘프제 장궁 "바람결"',
      '마법': '정령 소환, 치유 마법',
      '특수 능력': '정령과의 교감, 자연의 목소리',
      // 배경
      '과거 사건': '100년 전 정령의 숲이 황폐화되는 것을 목격',
      '사명': '잃어버린 세계수의 씨앗을 찾아야 함',
    },
    createdAt: '2024-01-16T10:00:00Z',
    updatedAt: '2024-12-18T09:00:00Z',
  },
  {
    id: '3',
    projectId: 'project-1',
    name: '카이로스',
    role: 'antagonist',
    extras: {
      // 기본 정보
      '나이': '추정 500세 이상',
      '종족': '타락한 천계인',
      '직업': '암흑의 군주',
      '본명': '알 수 없음 (봉인됨)',
      // 외형
      '외모': '검은 갑옷, 얼굴은 항상 가림',
      '특징': '왼팔이 마력으로 이루어짐',
      // 성격
      '성격': '냉철하고 계산적',
      '목표': '세계의 재창조',
      '신조': '힘만이 정의다',
      // 능력
      '마법': '흑마법, 차원술',
      '특수 능력': '죽은 자의 지배, 공포의 오라',
      '휘하 세력': '암흑 기사단, 마물 군단',
      // 배경
      '과거': '원래 천계의 수호천사였으나 타락',
      '건우 가문과의 관계': '15년 전 직접 습격하여 몰살',
    },
    createdAt: '2024-01-17T10:00:00Z',
    updatedAt: '2024-12-19T11:00:00Z',
  },
  {
    id: '4',
    projectId: 'project-1',
    name: '가온 대현자',
    role: 'mentor',
    extras: {
      // 기본 정보
      '나이': '78세',
      '종족': '인간',
      '직업': '대마법사, 예언자',
      '칭호': '별을 읽는 자',
      '거주지': '마법사 탑 최상층',
      // 외형
      '외모 특징': '긴 흰 수염, 자상한 눈빛',
      '복장': '별무늬 로브',
      // 성격
      '성격': '자상하지만 엄격한 스승',
      '가치관': '지식은 나누어야 한다',
      // 능력
      '마법': '예언술, 차원술, 봉인술',
      '특기': '과거와 미래를 보는 능력',
      '한계': '직접 전투는 피함',
      // 배경
      '과거': '젊은 시절 카이로스와 함께 수련',
      '건우와의 관계': '7살 때부터 키운 양부',
      '숨겨진 비밀': '건우의 진정한 정체를 알고 있음',
    },
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-12-17T16:00:00Z',
  },
];

const roleLabels: Record<CharacterRole, string> = {
  protagonist: '주인공',
  antagonist: '적대자',
  supporting: '조연',
  mentor: '멘토',
  sidekick: '조력자',
  other: '기타',
};

// 100개의 더미 캐릭터 생성
const characterNames = [
  '이건우', '아린', '카이로스', '가온', '하늘', '민준', '서연', '지우', '수빈', '예진',
  '현우', '다은', '준혁', '소연', '태호', '은지', '시우', '지민', '도윤', '민서',
  '유준', '하린', '재민', '서현', '승민', '지아', '주원', '연우', '도현', '채원',
  '은호', '유나', '정우', '나윤', '민혁', '하율', '시현', '가영', '준서', '수아',
  '태민', '서영', '유찬', '예원', '동현', '다인', '지호', '은서', '상현', '라온',
  '강민', '소율', '재윤', '유빈', '선호', '여진', '우진', '해온', '정훈', '이린',
  '지한', '수연', '태양', '다연', '현준', '가온', '성민', '은율', '승호', '미래',
  '찬영', '세아', '진우', '보라', '준호', '아영', '세준', '가현', '민우', '하영',
  '상윤', '세연', '현서', '나라', '건호', '유리', '도훈', '채아', '승현', '시아',
  '재현', '송이', '연호', '보나', '지환', '하은', '범준', '다희', '우현', '세라'
];

const roles: CharacterRole[] = ['protagonist', 'antagonist', 'supporting', 'mentor', 'sidekick', 'other'];
const relationTypes: RelationType[] = ['friendship', 'conflict', 'romance', 'family', 'neutral'];

// 랜덤 프로필 이미지 생성 함수
const getProfileImage = (index: number, gender: 'men' | 'women') => {
  // randomuser.me 스타일의 다양한 얼굴 이미지
  return `https://randomuser.me/api/portraits/${gender}/${index % 100}.jpg`;
};

// 100개 캐릭터 생성
const generatedCharacters: Character[] = characterNames.map((name, index) => {
  const isMale = Math.random() > 0.5;
  return {
    id: String(index + 1),
    projectId: 'project-1',
    name,
    role: index === 0 ? 'protagonist' : roles[Math.floor(Math.random() * roles.length)],
    image: getProfileImage(index, isMale ? 'men' : 'women'),
    extras: {
      '나이': `${Math.floor(Math.random() * 50) + 15}세`,
      '성별': isMale ? '남성' : '여성',
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-20T14:30:00Z',
  };
});

// 노드 위치 계산 (Force-directed 스타일 - 반발력 적용)
const generateNodePositions = () => {
  const centerX = 800;
  const centerY = 500;

  // 더 넓은 간격으로 스파이럴 배치 (옵시디언 스타일)
  return generatedCharacters.map((char, index) => {
    if (index === 0) {
      // 주인공은 중앙에
      return { x: centerX, y: centerY };
    }

    // 황금 각도 스파이럴 배치 (균등 분포)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // 137.5도
    const angle = index * goldenAngle;
    const radius = Math.sqrt(index) * 80; // 반발력 효과 시뮬레이션

    // 약간의 랜덤 오프셋 추가
    const jitterX = (Math.sin(index * 7) * 20);
    const jitterY = (Math.cos(index * 11) * 20);

    return {
      x: centerX + Math.cos(angle) * radius + jitterX,
      y: centerY + Math.sin(angle) * radius + jitterY
    };
  });
};

const nodePositions = generateNodePositions();

const initialNodes: Node[] = generatedCharacters.map((char, index) => ({
  id: char.id,
  type: 'character',
  position: nodePositions[index],
  data: {
    ...char,
  },
}));

// 랜덤 관계 생성 (약 150개)
const generateRandomEdges = () => {
  const edges: Edge[] = [];
  const edgeSet = new Set<string>();

  // 주인공과 모든 주요 캐릭터 연결
  for (let i = 2; i <= 20; i++) {
    const relType = relationTypes[Math.floor(Math.random() * relationTypes.length)];
    edges.push({
      id: `e1-${i}`,
      source: '1',
      target: String(i),
      type: 'default',
      style: {
        stroke: relationshipColors[relType],
        strokeWidth: 1.5,
        strokeOpacity: 0.6,
        strokeDasharray: relType === 'neutral' ? '3 3' : undefined
      },
      data: { type: relType },
    });
    edgeSet.add(`1-${i}`);
  }

  // 나머지 랜덤 관계
  for (let i = 0; i < 130; i++) {
    const source = Math.floor(Math.random() * 100) + 1;
    let target = Math.floor(Math.random() * 100) + 1;

    // 자기 자신이나 중복 방지
    if (source === target) target = (target % 100) + 1;
    const edgeKey = source < target ? `${source}-${target}` : `${target}-${source}`;
    if (edgeSet.has(edgeKey)) continue;

    edgeSet.add(edgeKey);
    const relType = relationTypes[Math.floor(Math.random() * relationTypes.length)];

    edges.push({
      id: `e${source}-${target}`,
      source: String(source),
      target: String(target),
      type: 'default',
      style: {
        stroke: relationshipColors[relType],
        strokeWidth: 1,
        strokeOpacity: 0.4,
        strokeDasharray: relType === 'neutral' ? '2 2' : undefined
      },
      data: { type: relType },
    });
  }

  return edges;
};

const initialEdges: Edge[] = generateRandomEdges();

// Mock Places
const places = [
  { id: '1', name: '왕국 아르카나', type: '지역', chapters: [1, 3, 5] },
  { id: '2', name: '금지된 숲', type: '지역', chapters: [2, 4] },
  { id: '3', name: '마법사 탑', type: '건물', chapters: [3, 6] },
];

// Mock Items
const items = [
  { id: '1', name: '전설의 검', type: '무기', owner: '주인공' },
  { id: '2', name: '마법 지팡이', type: '무기', owner: '현자 가온' },
  { id: '3', name: '예언서', type: '문서', owner: '없음' },
];

export default function WorldPage() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [characters] = useState<Character[]>(mockCharacters);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 필터링 상태
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
  const [relationTypeFilter, setRelationTypeFilter] = useState<RelationType | 'all'>('all');

  // 포커스된 노드와 연결된 노드 ID 계산
  const getConnectedNodeIds = useCallback((nodeId: string, relType: RelationType | 'all') => {
    const connectedIds = new Set<string>([nodeId]);

    initialEdges.forEach(edge => {
      const edgeType = edge.data?.type as RelationType;
      const matchesType = relType === 'all' || edgeType === relType;

      if (matchesType) {
        if (edge.source === nodeId) connectedIds.add(edge.target);
        if (edge.target === nodeId) connectedIds.add(edge.source);
      }
    });

    return connectedIds;
  }, []);

  // 필터링 적용
  useEffect(() => {
    if (!focusedNodeId) {
      // 필터 해제 - 모든 노드 원래 상태로
      setNodes(nodes => nodes.map(node => ({
        ...node,
        data: { ...node.data, dimmed: false, highlighted: false }
      })));
      setEdges(edges => edges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          strokeOpacity: edge.data?.type === 'neutral' ? 0.4 : 0.6,
          strokeWidth: edge.source === '1' || edge.target === '1' ? 1.5 : 1
        }
      })));
      return;
    }

    const connectedIds = getConnectedNodeIds(focusedNodeId, relationTypeFilter);

    // 노드 업데이트
    setNodes(nodes => nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        dimmed: !connectedIds.has(node.id),
        highlighted: node.id === focusedNodeId
      }
    })));

    // 엣지 업데이트
    setEdges(edges => edges.map(edge => {
      const edgeType = edge.data?.type as RelationType;
      const matchesType = relationTypeFilter === 'all' || edgeType === relationTypeFilter;
      const isConnected = (edge.source === focusedNodeId || edge.target === focusedNodeId) && matchesType;

      return {
        ...edge,
        style: {
          ...edge.style,
          strokeOpacity: isConnected ? 1 : 0.1,
          strokeWidth: isConnected ? 2.5 : 0.5
        }
      };
    }));
  }, [focusedNodeId, relationTypeFilter, getConnectedNodeIds, setNodes, setEdges]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    // 이미 포커스된 노드 클릭시 해제
    if (focusedNodeId === node.id) {
      setFocusedNodeId(null);
      return;
    }

    setFocusedNodeId(node.id);

    const character = generatedCharacters.find(c => c.id === node.id);
    if (character) {
      setSelectedCharacter(character);
    }
  };

  const handleCardClick = (character: Character) => {
    setSelectedCharacter(character);
    setIsModalOpen(true);
  };

  const clearFilter = useCallback(() => {
    setFocusedNodeId(null);
    setRelationTypeFilter('all');
  }, []);

  return (
    <div className="h-full">
      <Tabs defaultValue="graph" className="h-full flex flex-col">
        <div className="px-4 py-2 border-b bg-paper">
          <TabsList>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              캐릭터 관계도
            </TabsTrigger>
            <TabsTrigger value="characters" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              캐릭터 목록
            </TabsTrigger>
            <TabsTrigger value="places" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              장소
            </TabsTrigger>
            <TabsTrigger value="items" className="flex items-center gap-2">
              <Sword className="h-4 w-4" />
              아이템
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Character Graph */}
        <TabsContent value="graph" className="flex-1 m-0">
          <div className="h-full relative">
            {/* 좌측 컨트롤 패널 */}
            <div className="absolute left-4 top-4 z-10 bg-white rounded-lg border shadow-sm p-3 space-y-3">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider">Controls</div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-stone-600">100%</span>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8">
                    <Filter className="h-4 w-4" />
                    Filter View
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuRadioGroup value={relationTypeFilter} onValueChange={(v) => setRelationTypeFilter(v as RelationType | 'all')}>
                    <DropdownMenuRadioItem value="all">모든 관계</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="friendship">우호적 (초록)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="conflict">적대적 (빨강)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="romance">로맨스 (핑크)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="family">가족 (검정)</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="neutral">중립 (회색)</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" className="w-full justify-start gap-2 h-8">
                <Save className="h-4 w-4" />
                Save Layout
              </Button>
            </div>

            {/* 하단 범례 */}
            <div className="absolute left-4 bottom-4 z-10 bg-white rounded-lg border shadow-sm p-3">
              <div className="text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">Relationship Legend</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-green-500" />
                  <span>{relationshipLabels.friendship}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-red-500" />
                  <span>{relationshipLabels.conflict}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-pink-500" />
                  <span>{relationshipLabels.romance}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 bg-stone-800" />
                  <span>{relationshipLabels.family}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-0.5 border-t-2 border-dashed border-stone-400" />
                  <span>{relationshipLabels.neutral}</span>
                </div>
              </div>
            </div>

            {/* 우측 상세 패널 (선택된 캐릭터가 있을 때) */}
            {selectedCharacter && (
              <div className="absolute right-4 top-4 bottom-4 w-72 z-10 bg-white rounded-lg border shadow-lg overflow-hidden flex flex-col">
                <div className="p-4 border-b flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-2xl border-2 border-stone-200">
                      {selectedCharacter.role === 'protagonist' ? '🦸' :
                       selectedCharacter.role === 'antagonist' ? '🦹' :
                       selectedCharacter.role === 'mentor' ? '🧙' : '👤'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedCharacter.name}</h3>
                      <p className="text-sm text-muted-foreground">{roleLabels[selectedCharacter.role || 'other']}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedCharacter(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="p-4 border-b">
                  <div className="flex justify-around text-center">
                    <div>
                      <div className="text-2xl font-bold text-stone-800">{edges.filter(e => e.source === selectedCharacter.id || e.target === selectedCharacter.id).length}</div>
                      <div className="text-xs text-muted-foreground uppercase">Connections</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-stone-800">12</div>
                      <div className="text-xs text-muted-foreground uppercase">Scenes</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">Direct Links</h4>
                    <button className="text-xs text-blue-500 hover:underline">Add New</button>
                  </div>
                  <ul className="space-y-2">
                    {edges
                      .filter(e => e.source === selectedCharacter.id || e.target === selectedCharacter.id)
                      .map(edge => {
                        const otherId = edge.source === selectedCharacter.id ? edge.target : edge.source;
                        const otherChar = characters.find(c => c.id === otherId);
                        const relType = edge.data?.type as RelationType || 'neutral';
                        return (
                          <li key={edge.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-stone-50">
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-sm">
                              {otherChar?.role === 'antagonist' ? '🦹' : otherChar?.role === 'mentor' ? '🧙' : '👤'}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-sm">{otherChar?.name}</div>
                              <div className="text-xs" style={{ color: relationshipColors[relType] }}>
                                • {relationshipLabels[relType]}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                  </ul>
                </div>

                <div className="p-4 border-t">
                  <Button variant="outline" className="w-full" onClick={() => setIsModalOpen(true)}>
                    View Full Profile
                  </Button>
                </div>
              </div>
            )}

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={handleNodeClick}
              onPaneClick={clearFilter}
              nodeTypes={nodeTypes}
              fitView
              className="bg-white"
              style={{
                backgroundImage: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px), linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            >
              <Controls className="!bottom-20 !left-auto !right-4" />
              <Background color="#e2e8f0" gap={40} size={1} />
            </ReactFlow>
          </div>
        </TabsContent>

        {/* Characters List */}
        <TabsContent value="characters" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map((character) => (
              <Card
                key={character.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleCardClick(character)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">
                      {character.role === 'protagonist' ? '🦸' :
                       character.role === 'antagonist' ? '🦹' :
                       character.role === 'mentor' ? '🧙' : '👤'}
                    </span>
                    <div>
                      <CardTitle className="text-lg">{character.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {roleLabels[character.role || 'other']}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {Object.entries(character.extras || {}).slice(0, 2).map(([key, value]) => (
                    <p key={key}>{key}: {String(value)}</p>
                  ))}
                  {Object.keys(character.extras || {}).length > 2 && (
                    <p className="text-xs text-sage-500">
                      +{Object.keys(character.extras || {}).length - 2}개 항목 더보기
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card className="border-2 border-dashed border-sage-200 flex items-center justify-center cursor-pointer hover:border-sage-400 transition-colors min-h-[150px]">
              <div className="text-center">
                <Plus className="h-8 w-8 text-sage-400 mx-auto mb-2" />
                <p className="text-sage-600">새 캐릭터 추가</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Places */}
        <TabsContent value="places" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="space-y-2">
            {places.map((place) => (
              <Card key={place.id} className="cursor-pointer hover:bg-stone-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-sage-500" />
                    <div>
                      <p className="font-medium">{place.name}</p>
                      <p className="text-sm text-muted-foreground">{place.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    등장: {place.chapters.join(', ')}장
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Items */}
        <TabsContent value="items" className="flex-1 m-0 p-4 overflow-y-auto">
          <div className="space-y-2">
            {items.map((item) => (
              <Card key={item.id} className="cursor-pointer hover:bg-stone-50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Sword className="h-5 w-5 text-sage-500" />
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.type}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    소유자: {item.owner}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Character Detail Modal */}
      <CharacterDetailModal
        character={selectedCharacter}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
