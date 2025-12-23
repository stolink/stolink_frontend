import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  PenLine,
  GitBranch,
  Users,
  Sparkles,
  Image,
  FileText,
  ChevronRight
} from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: PenLine,
      title: '스마트 에디터',
      description: '마크다운 기반, 자동저장',
    },
    {
      icon: GitBranch,
      title: '복선 관리',
      description: '태그 기반 복선 추적',
    },
    {
      icon: Users,
      title: '캐릭터 관계도',
      description: '그래프 시각화',
    },
    {
      icon: Sparkles,
      title: 'AI 일관성 체크',
      description: '모순 감지',
    },
    {
      icon: Image,
      title: '장면 시각화',
      description: 'AI 이미지 생성',
    },
    {
      icon: FileText,
      title: '내보내기 & 공유',
      description: 'PDF, 마크다운',
    },
  ];

  return (
    <div className="min-h-screen bg-paper">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <PenLine className="h-6 w-6 text-sage-500" />
              <span className="text-xl font-heading font-bold text-sage-700">Sto-link</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost">로그인</Button>
              </Link>
              <Link to="/auth">
                <Button>시작하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-ink mb-6">
            당신의 이야기,<br />
            <span className="text-sage-500">하나도 놓치지 않게</span>
          </h1>
          <p className="text-xl text-stone-600 mb-8 max-w-2xl mx-auto">
            복선, 캐릭터, 설정을 한눈에 관리하세요.
            AI가 도와주는 스마트한 스토리 관리 플랫폼.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth">
              <Button size="lg" className="px-8">
                무료로 시작하기
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" size="lg">
                둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Editor Preview */}
      <section className="py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl bg-white shadow-2xl border overflow-hidden">
            <div className="bg-stone-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-sm text-stone-500 ml-4">StoLink 에디터</span>
            </div>
            <div className="p-8 min-h-[300px] bg-gradient-to-br from-sage-50 to-white">
              <div className="flex gap-4">
                <div className="w-48 border-r pr-4">
                  <p className="text-sm font-medium text-stone-500 mb-2">📁 1부: 여정의 시작</p>
                  <p className="text-sm text-sage-600 ml-4">📄 1장: 만남</p>
                  <p className="text-sm text-sage-600 ml-4 bg-sage-100 rounded px-2">📄 2장: 출발</p>
                </div>
                <div className="flex-1">
                  <p className="text-stone-700 leading-relaxed">
                    "이 검을 가져가거라." 노인이 말했다.
                    <span className="bg-sage-200 text-sage-800 px-1 rounded mx-1">#복선:전설의검</span>
                  </p>
                  <p className="text-stone-700 leading-relaxed mt-4">
                    주인공은 아직 이 검의 진정한 힘을 알지 못했다.
                    그것이 세상을 바꿀 열쇠라는 것을...
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-stone-800 mb-4">
            창작에만 집중하세요
          </h2>
          <p className="text-center text-stone-600 mb-12">
            복잡한 이야기 관리는 StoLink가 도와드립니다
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-xl bg-stone-50 hover:bg-sage-50 transition-colors"
              >
                <feature.icon className="h-10 w-10 text-sage-500 mb-4" />
                <h3 className="text-lg font-semibold text-stone-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-stone-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-sage-500 to-sage-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-sage-100 mb-8">
            무료로 시작하고, 당신만의 이야기를 체계적으로 관리하세요
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="px-8 bg-white text-sage-700 hover:bg-sage-50">
              무료로 시작하기
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-stone-800">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PenLine className="h-5 w-5 text-sage-400" />
            <span className="text-white font-heading font-semibold">Sto-link</span>
          </div>
          <div className="flex items-center gap-6 text-stone-400 text-sm">
            <a href="#" className="hover:text-white transition-colors">이용약관</a>
            <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-white transition-colors">문의하기</a>
          </div>
          <p className="text-stone-500 text-sm">
            © 2024 StoLink. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
