import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Bot,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Play,
  LayoutGrid,
  FileEdit,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUIStore } from '@/stores';
import { useDemoStore } from '@/stores/useDemoStore';
import { cn } from '@/lib/utils';
import ChapterTree from '@/components/editor/ChapterTree';
import TiptapEditor from '@/components/editor/TiptapEditor';
import ForeshadowingPanel from '@/components/editor/ForeshadowingPanel';
import AIAssistantPanel from '@/components/editor/AIAssistantPanel';
import ConsistencyPanel from '@/components/editor/ConsistencyPanel';
import GuidedTour from '@/components/common/GuidedTour';
import SectionGridView from '@/components/editor/SectionGridView';
import { DEMO_TOUR_STEPS, DEMO_CHAPTERS, DEMO_CHAPTER_CONTENTS } from '@/data/demoData';

interface EditorPageProps {
  isDemo?: boolean;
}

// 챕터 트리 구조 변환 함수
interface ChapterTreeNode {
  id: string;
  title: string;
  type: 'part' | 'chapter' | 'section';
  characterCount?: number;
  isPlot?: boolean;
  children?: ChapterTreeNode[];
}

function buildChapterTree(chapters: typeof DEMO_CHAPTERS): ChapterTreeNode[] {
  const map = new Map<string, ChapterTreeNode>();
  const roots: ChapterTreeNode[] = [];

  chapters.forEach(ch => {
    map.set(ch.id, {
      id: ch.id,
      title: ch.title,
      type: ch.type,
      characterCount: ch.characterCount,
      isPlot: ch.isPlot,
      children: [],
    });
  });

  chapters.forEach(ch => {
    const node = map.get(ch.id)!;
    if (ch.parentId && map.has(ch.parentId)) {
      map.get(ch.parentId)!.children!.push(node);
    } else if (!ch.parentId) {
      roots.push(node);
    }
  });

  return roots;
}

// 뷰 모드 타입
type ViewMode = 'editor' | 'grid';

export default function EditorPage({ isDemo = false }: EditorPageProps) {
  const navigate = useNavigate();
  const {
    leftSidebarOpen,
    rightSidebarOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    rightSidebarTab,
    setRightSidebarTab
  } = useUIStore();

  const { isTourActive, startTour, endTour, completeTour, isTourCompleted } = useDemoStore();
  const [characterCount, setCharacterCount] = useState(0);
  const [showTourPrompt, setShowTourPrompt] = useState(false);

  // 뷰 모드 상태
  const [viewMode, setViewMode] = useState<ViewMode>('editor');

  // 챕터 선택 상태
  const [selectedChapterId, setSelectedChapterId] = useState<string>('chapter-1-1');
  const [editorKey, setEditorKey] = useState(0);

  // 데모 챕터 트리 빌드
  const demoChapterTree = useMemo(() => buildChapterTree(DEMO_CHAPTERS), []);

  // 섹션 목록 (Grid View용)
  const sections = useMemo(() => {
    return DEMO_CHAPTERS
      .filter(ch => ch.type === 'section' && DEMO_CHAPTER_CONTENTS[ch.id])
      .map(ch => ({
        id: ch.id,
        title: ch.title,
        content: DEMO_CHAPTER_CONTENTS[ch.id] || '',
        characterCount: ch.characterCount,
        type: 'section' as const,
      }));
  }, []);

  // 현재 선택된 챕터의 컨텐츠
  const currentContent = useMemo(() => {
    if (!isDemo) return undefined;
    return DEMO_CHAPTER_CONTENTS[selectedChapterId] || '';
  }, [isDemo, selectedChapterId]);

  // 챕터 선택 핸들러
  const handleSelectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setEditorKey(prev => prev + 1);
    // Grid에서 선택 시 에디터 모드로 전환
    if (viewMode === 'grid') {
      setViewMode('editor');
    }
  };

  // 데모 모드 진입 시 투어 시작 프롬프트
  useEffect(() => {
    if (isDemo && !isTourCompleted && !isTourActive) {
      const timer = setTimeout(() => {
        setShowTourPrompt(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isDemo, isTourCompleted, isTourActive]);

  const handleStartTour = () => {
    setShowTourPrompt(false);
    startTour();
  };

  const handleSkipTour = () => {
    setShowTourPrompt(false);
  };

  return (
    <div className={cn("flex flex-col", isDemo ? "h-screen" : "h-full")}>
      {/* Demo Mode Header */}
      {isDemo && (
        <div className="px-4 py-2 bg-gradient-to-r from-sage-500 to-sage-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              홈으로
            </Button>
            <span className="text-sm opacity-90">
              🎮 데모 모드 - "마법사의 여정" 체험 중
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isTourCompleted && (
              <Button
                variant="ghost"
                size="sm"
                onClick={startTour}
                className="text-white hover:bg-white/20"
              >
                <Play className="h-4 w-4 mr-1" />
                가이드 투어
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => navigate('/auth')}
              className="bg-white text-sage-600 hover:bg-white/90"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              회원가입하고 시작
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Chapter Tree */}
        <aside
          data-tour="chapter-tree"
          className={cn(
            'bg-paper border-r border-stone-200 transition-all duration-300 flex flex-col',
            leftSidebarOpen ? 'w-64' : 'w-0'
          )}
        >
          {leftSidebarOpen && (
            <>
              <div className="p-3 border-b flex items-center justify-between">
                <h2 className="font-medium text-sm">챕터 목록</h2>
                <Button variant="ghost" size="icon" onClick={toggleLeftSidebar}>
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-2 flex flex-col">
                <ChapterTree
                  chapters={isDemo ? demoChapterTree : undefined}
                  selectedChapterId={selectedChapterId}
                  onSelectChapter={handleSelectChapter}
                />
              </div>
            </>
          )}
        </aside>

        {/* Toggle button when closed */}
        {!leftSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLeftSidebar}
            className="absolute left-2 top-2 z-10"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        )}

        {/* Center - Editor or Grid View */}
        <main data-tour="editor" className="flex-1 flex flex-col bg-white min-w-0">
          {/* View Mode Toggle */}
          <div className="px-4 py-2 border-b bg-stone-50 flex items-center justify-between">
            <div className="flex items-center gap-1 bg-white rounded-lg p-1 border">
              <Button
                variant={viewMode === 'editor' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('editor')}
                className={cn(
                  'h-7 px-3',
                  viewMode === 'editor' && 'bg-sage-500 hover:bg-sage-600'
                )}
              >
                <FileEdit className="h-3.5 w-3.5 mr-1.5" />
                에디터
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'h-7 px-3',
                  viewMode === 'grid' && 'bg-sage-500 hover:bg-sage-600'
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5 mr-1.5" />
                카드뷰
              </Button>
            </div>

            {viewMode === 'editor' && (
              <span className="text-xs text-muted-foreground">
                현재: {sections.find(s => s.id === selectedChapterId)?.title || '섹션 선택'}
              </span>
            )}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {viewMode === 'editor' ? (
              <TiptapEditor
                key={editorKey}
                onUpdate={(count) => setCharacterCount(count)}
                initialContent={currentContent}
              />
            ) : (
              <SectionGridView
                sections={sections}
                selectedSectionId={selectedChapterId}
                onSelectSection={handleSelectChapter}
              />
            )}
          </div>

          {/* Bottom Status Bar */}
          <div className="px-4 py-2 border-t bg-stone-50 flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              {viewMode === 'editor' ? (
                <>
                  <span>글자수: {characterCount.toLocaleString()}</span>
                  <span className="text-sage-500">맞춤법 검사 ON</span>
                </>
              ) : (
                <span>총 {sections.length}개 섹션</span>
              )}
            </div>
            <span className="text-xs">자동 저장 활성화</span>
          </div>
        </main>

        {/* Right Sidebar - Foreshadowing / AI / Consistency */}
        <aside
          className={cn(
            'bg-white border-l transition-all duration-300 flex flex-col',
            rightSidebarOpen ? 'w-80' : 'w-0'
          )}
        >
          {rightSidebarOpen && (
            <>
              <div className="p-2 border-b flex items-center justify-between">
                <Tabs value={rightSidebarTab} onValueChange={(v) => setRightSidebarTab(v as 'foreshadowing' | 'ai' | 'consistency')}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="foreshadowing" className="text-xs px-2" data-tour="foreshadowing-panel">
                      <FileText className="h-3 w-3 mr-1" />
                      복선
                    </TabsTrigger>
                    <TabsTrigger value="ai" className="text-xs px-2" data-tour="ai-panel">
                      <Bot className="h-3 w-3 mr-1" />
                      AI
                    </TabsTrigger>
                    <TabsTrigger value="consistency" className="text-xs px-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      체크
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <Button variant="ghost" size="icon" onClick={toggleRightSidebar}>
                  <PanelRightClose className="h-4 w-4" />
                </Button>
              </div>
              <div className={cn(
                'flex-1',
                rightSidebarTab === 'ai' ? 'overflow-hidden' : 'overflow-y-auto'
              )}>
                {rightSidebarTab === 'foreshadowing' && <ForeshadowingPanel />}
                {rightSidebarTab === 'ai' && <AIAssistantPanel />}
                {rightSidebarTab === 'consistency' && <ConsistencyPanel />}
              </div>
            </>
          )}
        </aside>

        {/* Toggle button when closed */}
        {!rightSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightSidebar}
            className="absolute right-2 top-2 z-10"
          >
            <PanelRightOpen className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Tour Start Prompt */}
      {showTourPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-sage-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">StoLink 둘러보기</h2>
              <p className="text-muted-foreground">
                AI 기반 스토리 관리 플랫폼의 주요 기능을 안내해드릴게요. 약 1분 정도 소요됩니다.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleSkipTour}>
                나중에 할게요
              </Button>
              <Button className="flex-1" onClick={handleStartTour}>
                <Play className="h-4 w-4 mr-2" />
                시작하기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Tour */}
      <GuidedTour
        steps={DEMO_TOUR_STEPS}
        isOpen={isTourActive}
        onClose={endTour}
        onComplete={completeTour}
      />
    </div>
  );
}
