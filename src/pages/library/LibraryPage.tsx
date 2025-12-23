import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, LogOut, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuthStore, useUIStore } from '@/stores';
import type { Project, Genre } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

// Mock data
const mockProjects: Project[] = [
  {
    id: '1',
    title: '마법사의 여정',
    genre: 'fantasy',
    description: '젊은 마법사의 성장 이야기',
    status: 'writing',
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-20T00:00:00Z',
    userId: '1',
    stats: {
      totalCharacters: 45000,
      totalWords: 15000,
      chapterCount: 12,
      characterCount: 8,
      foreshadowingRecoveryRate: 67,
      consistencyScore: 94,
    },
  },
  {
    id: '2',
    title: '별빛 연가',
    genre: 'romance',
    description: '우연한 만남에서 시작된 사랑',
    status: 'completed',
    createdAt: '2024-10-15T00:00:00Z',
    updatedAt: '2024-11-30T00:00:00Z',
    userId: '1',
    stats: {
      totalCharacters: 120000,
      totalWords: 40000,
      chapterCount: 24,
      characterCount: 12,
      foreshadowingRecoveryRate: 100,
      consistencyScore: 98,
    },
  },
  {
    id: '3',
    title: '2150년의 기억',
    genre: 'sf',
    description: '미래 도시에서 벌어지는 미스터리',
    status: 'writing',
    createdAt: '2024-11-20T00:00:00Z',
    updatedAt: '2024-12-18T00:00:00Z',
    userId: '1',
    stats: {
      totalCharacters: 28000,
      totalWords: 9300,
      chapterCount: 7,
      characterCount: 5,
      foreshadowingRecoveryRate: 40,
      consistencyScore: 88,
    },
  },
];

const genreLabels: Record<Genre, string> = {
  fantasy: '판타지',
  romance: '로맨스',
  sf: 'SF',
  mystery: '추리',
  other: '기타',
};

const genreColors: Record<Genre, string> = {
  fantasy: 'bg-purple-100 text-purple-700',
  romance: 'bg-pink-100 text-pink-700',
  sf: 'bg-blue-100 text-blue-700',
  mystery: 'bg-amber-100 text-amber-700',
  other: 'bg-stone-100 text-stone-700',
};

export default function LibraryPage() {
  const { user, logout } = useAuthStore();
  const { setCreateProjectModalOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [projects] = useState<Project[]>(mockProjects);

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-paper/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-heading font-bold text-sage-700">📚 {user?.nickname || '작가'}님의 서재</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{user?.nickname || '작가님'}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="작품 검색..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            필터
          </Button>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* New Project Card */}
          <Card
            className="border-2 border-dashed border-sage-200 hover:border-sage-400 cursor-pointer transition-colors flex items-center justify-center min-h-[280px]"
            onClick={() => setCreateProjectModalOpen(true)}
          >
            <CardContent className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mb-4">
                <Plus className="h-8 w-8 text-sage-500" />
              </div>
              <p className="font-medium text-sage-700">새 작품 만들기</p>
              <p className="text-sm text-muted-foreground mt-1">새로운 이야기를 시작하세요</p>
            </CardContent>
          </Card>

          {/* Project Cards */}
          {filteredProjects.map((project) => (
            <Link key={project.id} to={`/projects/${project.id}/editor`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden group">
                {/* Cover Image */}
                <div className="aspect-[3/4] bg-gradient-to-br from-sage-100 to-sage-200 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-4xl">📖</span>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>

                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-1">{project.title}</CardTitle>
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${genreColors[project.genre]}`}
                    >
                      {genreLabels[project.genre]}
                    </span>
                  </div>
                  <CardDescription className="flex items-center gap-2 text-sm">
                    <span>최종 수정: {formatRelativeTime(project.updatedAt)}</span>
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        project.status === 'writing' ? 'bg-amber-500' : 'bg-green-500'
                      }`}
                    />
                    <span className="text-sm text-muted-foreground">
                      {project.status === 'writing' ? '집필중' : '완결'}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">검색 결과가 없습니다</p>
          </div>
        )}
      </main>
    </div>
  );
}
