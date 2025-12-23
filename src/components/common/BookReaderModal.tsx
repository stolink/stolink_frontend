import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Type, Minus, Plus, List, BookOpen, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  title: string;
  content: string;
}

interface BookReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapters: Chapter[];
  initialChapterId?: string;
  bookTitle?: string;
}

type Theme = 'light' | 'dark' | 'sepia';
type ViewMode = 'scroll' | 'book';

export function BookReaderModal({
  isOpen,
  onClose,
  chapters,
  initialChapterId,
  bookTitle = '미리보기',
}: BookReaderModalProps) {
  const getInitialIndex = () => {
    if (initialChapterId) {
      const index = chapters.findIndex(ch => ch.id === initialChapterId);
      return index >= 0 ? index : 0;
    }
    return 0;
  };

  const [currentChapterIndex, setCurrentChapterIndex] = useState(getInitialIndex);
  const [theme, setTheme] = useState<Theme>('light');
  const [fontSize, setFontSize] = useState(18);
  const [showToc, setShowToc] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('book');
  const [showControls, setShowControls] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 컨트롤 자동 숨김
  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  const currentChapter = chapters[currentChapterIndex] || chapters[0];
  const hasPrev = currentChapterIndex > 0;
  const hasNext = currentChapterIndex < chapters.length - 1;

  const goToPrev = useCallback(() => {
    if (hasPrev) setCurrentChapterIndex(prev => prev - 1);
  }, [hasPrev]);

  const goToNext = useCallback(() => {
    if (hasNext) setCurrentChapterIndex(prev => prev + 1);
  }, [hasNext]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (viewMode === 'book') {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          goToPrev();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          goToNext();
        }
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, viewMode, goToPrev, goToNext, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 챕터 변경 시 스크롤 리셋
  useEffect(() => {
    if (mainRef.current && viewMode === 'book') {
      mainRef.current.scrollTop = 0;
    }
  }, [currentChapterIndex, viewMode]);

  if (!isOpen || chapters.length === 0) return null;

  const themeStyles = {
    light: 'bg-white text-stone-800',
    dark: 'bg-stone-900 text-stone-100',
    sepia: 'bg-amber-50 text-stone-800',
  };

  const themeButtonStyles = {
    light: 'bg-white border-stone-300',
    dark: 'bg-stone-800 border-stone-600',
    sepia: 'bg-amber-100 border-amber-300',
  };

  // 클릭 영역 네비게이션 (책 모드에서만)
  const handleContentClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== 'book') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;

    // 좌측 30% 클릭 = 이전, 우측 30% 클릭 = 다음
    if (clickX < width * 0.3) {
      goToPrev();
    } else if (clickX > width * 0.7) {
      goToNext();
    }
  };

  return (
    <div className={cn(
      'fixed inset-0 z-[200] flex flex-col',
      themeStyles[theme]
    )}>
      {/* Header */}
      <header className={cn(
        'h-14 px-4 flex items-center justify-between border-b shrink-0 transition-colors',
        theme === 'dark' ? 'bg-stone-900 border-stone-700 text-white' : 'bg-white border-stone-200 text-stone-800'
      )}>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <h1 className="font-heading text-lg font-semibold">{bookTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className={cn(
            'flex items-center rounded-lg p-1',
            theme === 'dark' ? 'bg-stone-800' : 'bg-stone-100'
          )}>
            <button
              onClick={() => setViewMode('book')}
              className={cn(
                'px-3 py-1 rounded-md text-sm flex items-center gap-1.5 transition-colors',
                viewMode === 'book'
                  ? theme === 'dark' ? 'bg-stone-700 text-white' : 'bg-white text-stone-800 shadow-sm'
                  : theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
              )}
              title="책 모드 (방향키로 이동)"
            >
              <BookOpen className="h-4 w-4" />
              책
            </button>
            <button
              onClick={() => setViewMode('scroll')}
              className={cn(
                'px-3 py-1 rounded-md text-sm flex items-center gap-1.5 transition-colors',
                viewMode === 'scroll'
                  ? theme === 'dark' ? 'bg-stone-700 text-white' : 'bg-white text-stone-800 shadow-sm'
                  : theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
              )}
              title="스크롤 모드"
            >
              <ScrollText className="h-4 w-4" />
              스크롤
            </button>
          </div>

          {/* TOC Toggle */}
          <Button variant="ghost" size="icon" onClick={() => setShowToc(!showToc)}>
            <List className="h-5 w-5" />
          </Button>

          {/* Font Size */}
          <div className={cn(
            'flex items-center gap-1 px-2 border-l border-r mx-2',
            theme === 'dark' ? 'border-stone-700' : 'border-stone-200'
          )}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(Math.max(14, fontSize - 2))}
              disabled={fontSize <= 14}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Type className="h-4 w-4" />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFontSize(Math.min(28, fontSize + 2))}
              disabled={fontSize >= 28}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Theme Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all',
                themeButtonStyles.light,
                theme === 'light' && 'ring-2 ring-sage-500 ring-offset-2'
              )}
              title="밝은 테마"
            />
            <button
              onClick={() => setTheme('sepia')}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all',
                themeButtonStyles.sepia,
                theme === 'sepia' && 'ring-2 ring-sage-500 ring-offset-2'
              )}
              title="세피아 테마"
            />
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-all',
                themeButtonStyles.dark,
                theme === 'dark' && 'ring-2 ring-sage-500 ring-offset-2'
              )}
              title="어두운 테마"
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* TOC Sidebar */}
        {showToc && (
          <aside className={cn(
            'w-64 border-r shrink-0 overflow-y-auto transition-colors',
            theme === 'dark' ? 'bg-stone-800 border-stone-700' : 'bg-stone-50 border-stone-200'
          )}>
            <div className="p-4">
              <h2 className={cn(
                'text-sm font-medium mb-3',
                theme === 'dark' ? 'text-stone-300' : 'text-stone-600'
              )}>
                목차
              </h2>
              <ul className="space-y-1">
                {chapters.map((chapter, idx) => (
                  <li key={chapter.id}>
                    <button
                      onClick={() => {
                        setCurrentChapterIndex(idx);
                        setShowToc(false);
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        idx === currentChapterIndex
                          ? theme === 'dark'
                            ? 'bg-stone-700 text-white'
                            : 'bg-sage-100 text-sage-700'
                          : theme === 'dark'
                            ? 'text-stone-300 hover:bg-stone-700'
                            : 'text-stone-600 hover:bg-stone-100'
                      )}
                    >
                      {chapter.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}

        {/* Reading Area */}
        <main
          ref={mainRef}
          className={cn(
            'flex-1 overflow-y-auto transition-colors relative',
            themeStyles[theme],
            viewMode === 'book' && 'cursor-pointer select-none'
          )}
          onClick={handleContentClick}
        >
          {viewMode === 'scroll' ? (
            // 무한 스크롤 모드: 모든 챕터를 연속해서 표시
            <div className="max-w-2xl mx-auto px-8 py-12" style={{ fontSize: `${fontSize}px` }}>
              {chapters.map((chapter, idx) => (
                <article key={chapter.id} className="mb-16 last:mb-0">
                  <h2 className={cn(
                    'text-2xl font-heading font-bold mb-8 text-center',
                    theme === 'dark' ? 'text-white' : 'text-stone-800'
                  )}>
                    {chapter.title}
                  </h2>
                  <div
                    className="font-body leading-relaxed"
                    style={{ lineHeight: '1.9' }}
                    dangerouslySetInnerHTML={{ __html: chapter.content.replace(/\n/g, '<br/><br/>') }}
                  />
                  {idx < chapters.length - 1 && (
                    <div className={cn(
                      'mt-16 border-t pt-16',
                      theme === 'dark' ? 'border-stone-700' : 'border-stone-200'
                    )} />
                  )}
                </article>
              ))}
            </div>
          ) : (
            // 책 모드: CSS columns로 좌→우 페이지 흐름
            <div className="h-full flex flex-col overflow-hidden p-8">
              {/* 챕터 헤더 */}
              <div className="text-center mb-6 shrink-0">
                <div className={cn(
                  'text-xs uppercase tracking-wider mb-2',
                  theme === 'dark' ? 'text-stone-500' : 'text-stone-400'
                )}>
                  {currentChapter.title}
                </div>
              </div>

              {/* 2단 페이지 영역 */}
              <div
                className="flex-1 relative overflow-hidden"
                style={{
                  columnCount: 2,
                  columnGap: '3rem',
                  columnRule: `1px solid ${theme === 'dark' ? '#44403c' : '#d6d3d1'}`,
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.8',
                }}
              >
                {/* 좌측 클릭 영역 */}
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-1/2 cursor-pointer z-10',
                    'hover:bg-black/5 transition-colors'
                  )}
                  onClick={goToPrev}
                >
                  {hasPrev && (
                    <div className={cn(
                      'absolute left-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity',
                      theme === 'dark' ? 'text-stone-600' : 'text-stone-300'
                    )}>
                      <ChevronLeft className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* 우측 클릭 영역 */}
                <div
                  className={cn(
                    'absolute right-0 top-0 bottom-0 w-1/2 cursor-pointer z-10',
                    'hover:bg-black/5 transition-colors'
                  )}
                  onClick={goToNext}
                >
                  {hasNext && (
                    <div className={cn(
                      'absolute right-4 top-1/2 -translate-y-1/2 opacity-0 hover:opacity-100 transition-opacity',
                      theme === 'dark' ? 'text-stone-600' : 'text-stone-300'
                    )}>
                      <ChevronRight className="h-12 w-12" />
                    </div>
                  )}
                </div>

                {/* 콘텐츠 (자동으로 좌→우 흐름) */}
                <div
                  className="font-body h-full"
                  dangerouslySetInnerHTML={{
                    __html: currentChapter.content.replace(/\n/g, '<br/><br/>')
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer Navigation (책 모드에서만) - 자동 숨김 */}
      {viewMode === 'book' && (
        <>
          {/* 숨겨진 상태에서 하단 호버 영역 */}
          {!showControls && (
            <div
              className="h-6 w-full cursor-pointer flex items-center justify-center"
              onMouseEnter={showControlsTemporarily}
              onClick={showControlsTemporarily}
            >
              <div className={cn(
                'w-12 h-1 rounded-full',
                theme === 'dark' ? 'bg-stone-700' : 'bg-stone-200'
              )} />
            </div>
          )}

          {/* 컨트롤 바 */}
          <footer
            className={cn(
              'px-4 flex items-center justify-between border-t shrink-0 transition-all duration-300',
              theme === 'dark' ? 'bg-stone-900 border-stone-700 text-white' : 'bg-white border-stone-200 text-stone-800',
              showControls ? 'h-14 opacity-100' : 'h-0 opacity-0 overflow-hidden'
            )}
            onMouseEnter={showControlsTemporarily}
          >
            <Button
              variant="ghost"
              onClick={goToPrev}
              disabled={!hasPrev}
              className="gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>

            <div className="flex flex-col items-center">
              <span className={cn(
                'text-sm',
                theme === 'dark' ? 'text-stone-400' : 'text-stone-500'
              )}>
                {currentChapterIndex + 1} / {chapters.length}
              </span>
            </div>

            <Button
              variant="ghost"
              onClick={goToNext}
              disabled={!hasNext}
              className="gap-2"
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </footer>
        </>
      )}
    </div>
  );
}

