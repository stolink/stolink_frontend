import { useState, useMemo } from 'react';
import {
  Search, ChevronDown, ChevronRight, User, Palette,
  Heart, History, Sparkles, MapPin, Users, Tag, X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Character, CharacterRole } from '@/types';
import { cn } from '@/lib/utils';

interface CharacterDetailModalProps {
  character: Character | null;
  isOpen: boolean;
  onClose: () => void;
}

// 카테고리 정의 - LLM이 파싱한 데이터를 그룹화
const CATEGORY_CONFIG: Record<string, {
  icon: React.ElementType;
  label: string;
  keywords: string[];
  color: string;
}> = {
  basic: {
    icon: User,
    label: '기본 정보',
    keywords: ['이름', '나이', '성별', '종족', '직업', '출신', '신분', '혈액형'],
    color: 'bg-blue-500',
  },
  appearance: {
    icon: Palette,
    label: '외형',
    keywords: ['키', '몸무게', '외모', '헤어', '머리', '눈', '피부', '특징', '복장', '체형'],
    color: 'bg-purple-500',
  },
  personality: {
    icon: Heart,
    label: '성격/심리',
    keywords: ['성격', '성향', '가치관', '목표', '두려움', '습관', '취미', '좋아하는', '싫어하는', 'MBTI'],
    color: 'bg-pink-500',
  },
  background: {
    icon: History,
    label: '배경/역사',
    keywords: ['과거', '역사', '트라우마', '사건', '경험', '어린시절', '가족', '부모', '형제'],
    color: 'bg-amber-500',
  },
  abilities: {
    icon: Sparkles,
    label: '능력/스킬',
    keywords: ['능력', '스킬', '기술', '마법', '무기', '전투', '특기', '재능', '약점'],
    color: 'bg-emerald-500',
  },
  location: {
    icon: MapPin,
    label: '장소/소속',
    keywords: ['거주지', '위치', '소속', '조직', '국가', '마을', '집'],
    color: 'bg-cyan-500',
  },
  relationships: {
    icon: Users,
    label: '관계',
    keywords: ['관계', '친구', '적', '연인', '스승', '제자', '동료'],
    color: 'bg-rose-500',
  },
  other: {
    icon: Tag,
    label: '기타',
    keywords: [],
    color: 'bg-stone-500',
  },
};

const roleLabels: Record<CharacterRole, string> = {
  protagonist: '주인공',
  antagonist: '적대자',
  supporting: '조연',
  mentor: '멘토',
  sidekick: '조력자',
  other: '기타',
};

// 키워드 기반으로 카테고리 분류
function categorizeExtras(extras: Record<string, unknown> = {}): Record<string, Record<string, unknown>> {
  const categorized: Record<string, Record<string, unknown>> = {
    basic: {},
    appearance: {},
    personality: {},
    background: {},
    abilities: {},
    location: {},
    relationships: {},
    other: {},
  };

  Object.entries(extras).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    let assigned = false;

    for (const [category, config] of Object.entries(CATEGORY_CONFIG)) {
      if (config.keywords.some(keyword => lowerKey.includes(keyword.toLowerCase()))) {
        categorized[category][key] = value;
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      categorized.other[key] = value;
    }
  });

  return categorized;
}

export default function CharacterDetailModal({
  character,
  isOpen,
  onClose,
}: CharacterDetailModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['basic', 'personality', 'abilities'])
  );

  // 카테고리별로 분류된 extras
  const categorizedExtras = useMemo(() => {
    if (!character?.extras) return {};
    return categorizeExtras(character.extras as Record<string, unknown>);
  }, [character?.extras]);

  // 검색 필터링
  const filteredExtras = useMemo(() => {
    if (!searchQuery.trim()) return categorizedExtras;

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, Record<string, unknown>> = {};

    Object.entries(categorizedExtras).forEach(([category, items]) => {
      const matchedItems: Record<string, unknown> = {};
      Object.entries(items).forEach(([key, value]) => {
        if (
          key.toLowerCase().includes(query) ||
          String(value).toLowerCase().includes(query)
        ) {
          matchedItems[key] = value;
        }
      });
      if (Object.keys(matchedItems).length > 0) {
        filtered[category] = matchedItems;
      }
    });

    return filtered;
  }, [categorizedExtras, searchQuery]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const totalExtrasCount = Object.values(categorizedExtras).reduce(
    (sum, items) => sum + Object.keys(items).length,
    0
  );

  if (!character) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start gap-4">
            {/* Character Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-sage-100 to-sage-200 flex items-center justify-center text-4xl shadow-inner">
              {character.imageUrl ? (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                character.role === 'protagonist' ? '🦸' :
                character.role === 'antagonist' ? '🦹' :
                character.role === 'mentor' ? '🧙' : '👤'
              )}
            </div>

            {/* Character Info */}
            <div className="flex-1">
              <DialogTitle className="text-2xl font-bold mb-1">
                {character.name}
              </DialogTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium text-white',
                  character.role === 'protagonist' ? 'bg-sage-500' :
                  character.role === 'antagonist' ? 'bg-rose-500' :
                  character.role === 'mentor' ? 'bg-amber-500' : 'bg-stone-400'
                )}>
                  {roleLabels[character.role || 'other']}
                </span>
                <span>•</span>
                <span>{totalExtrasCount}개 속성</span>
              </div>

              {/* Quick Stats - 가장 중요한 정보 표시 */}
              <div className="flex flex-wrap gap-2 mt-3">
                {Object.entries(character.extras || {}).slice(0, 4).map(([key, value]) => (
                  <span
                    key={key}
                    className="px-2 py-1 bg-stone-100 rounded-lg text-xs"
                  >
                    <span className="text-muted-foreground">{key}:</span>{' '}
                    <span className="font-medium">{String(value)}</span>
                  </span>
                ))}
                {totalExtrasCount > 4 && (
                  <span className="px-2 py-1 text-xs text-sage-600">
                    +{totalExtrasCount - 4}개
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b bg-stone-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="속성 검색... (예: 성격, 능력, 과거)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Categories */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-3">
            {Object.entries(CATEGORY_CONFIG).map(([categoryKey, config]) => {
              const items = filteredExtras[categoryKey];
              if (!items || Object.keys(items).length === 0) return null;

              const isExpanded = expandedCategories.has(categoryKey);
              const Icon = config.icon;

              return (
                <div
                  key={categoryKey}
                  className="border rounded-xl overflow-hidden"
                >
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(categoryKey)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-stone-50 transition-colors"
                  >
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-white',
                      config.color
                    )}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium flex-1 text-left">
                      {config.label}
                    </span>
                    <span className="text-sm text-muted-foreground mr-2">
                      {Object.keys(items).length}개
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Category Items */}
                  {isExpanded && (
                    <div className="border-t bg-stone-50/50 divide-y">
                      {Object.entries(items).map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-start gap-3 px-4 py-3 hover:bg-white transition-colors"
                        >
                          <span className="text-sm font-medium text-stone-600 min-w-[100px]">
                            {key}
                          </span>
                          <span className="text-sm text-stone-800 flex-1">
                            {Array.isArray(value)
                              ? value.join(', ')
                              : String(value)
                            }
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Empty State */}
            {Object.keys(filteredExtras).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>"{searchQuery}"에 해당하는 정보가 없습니다</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-stone-50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            AI가 분석한 캐릭터 정보 • 마지막 업데이트:{' '}
            {new Date(character.updatedAt).toLocaleDateString('ko-KR')}
          </p>
          <Button variant="outline" onClick={onClose}>
            닫기
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
