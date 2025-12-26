import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/common/Footer";
import {
  PenLine,
  GitBranch,
  Users,
  Sparkles,
  Image as ImageIcon,
  FileText,
  ChevronRight,
} from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const features = [
    {
      icon: PenLine,
      title: "스마트 에디터",
      description: "마크다운 기반, 자동저장",
    },
    {
      icon: GitBranch,
      title: "복선 관리",
      description: "태그 기반 복선 추적",
    },
    {
      icon: Users,
      title: "캐릭터 관계도",
      description: "그래프 시각화",
    },
    {
      icon: Sparkles,
      title: "AI 일관성 체크",
      description: "모순 감지",
    },
    {
      icon: ImageIcon,
      title: "장면 시각화",
      description: "AI 이미지 생성",
    },
    {
      icon: FileText,
      title: "내보내기 & 공유",
      description: "PDF, 마크다운",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img
                src="/assets/main_logo.png"
                alt="Sto-Link"
                className="h-[60px] w-auto"
              />
            </div>
            <div className="flex items-center gap-4">
              <Link to="/auth">
                <Button variant="ghost">로그인</Button>
              </Link>
              <Link to="/auth">
                <Button className="shadow-sm">시작하기</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 overflow-hidden">
        <motion.div
          className="max-w-4xl mx-auto text-center"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div
            variants={itemVariants}
            className="flex justify-center mb-10"
          >
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-sage-200 to-sage-100 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <img
                src="/assets/main_logo.png"
                alt="Sto-Link Logo"
                className="relative h-60 sm:h-60 w-auto drop-shadow-md transition-transform duration-500 hover:scale-105"
              />
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold text-ink mb-8 tracking-tight"
          >
            당신의 이야기,
            <br />
            <span className="text-sage-500">하나도 놓치지 않게</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-xl sm:text-2xl text-stone-600 mb-10 max-w-2xl mx-auto font-light leading-relaxed"
          >
            복선, 캐릭터, 설정을 한눈에 관리하세요.
            <br className="hidden sm:block" />
            AI가 도와주는 스마트한 스토리 관리 플랫폼.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link to="/auth" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto px-10 h-14 text-lg shadow-lg hover:shadow-xl transition-all"
              >
                무료로 시작하기
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/demo" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-10 h-14 text-lg border-2"
              >
                둘러보기
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Editor Preview */}
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 bg-stone-50/50 -z-10" />
        <motion.div
          className="max-w-5xl mx-auto"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="rounded-2xl bg-white shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-stone-50 px-4 py-3 flex items-center gap-2 border-b">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <span className="text-xs font-medium text-stone-400 ml-4 tracking-wider uppercase">
                StoLink 에디션 v1.0
              </span>
            </div>
            <div className="p-8 sm:p-12 min-h-[400px] bg-gradient-to-br from-paper/30 to-white">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="w-full md:w-64 space-y-4">
                  <div className="p-3 rounded-lg bg-stone-100/50 border border-stone-200/50 shadow-sm">
                    <p className="text-sm font-bold text-stone-700">
                      📁 1부: 여정의 시작
                    </p>
                  </div>
                  <div className="space-y-1 pl-4 border-l-2 border-sage-100 ml-2">
                    <p className="text-sm text-stone-400 py-1 flex items-center gap-2">
                      <FileText size={14} /> 1장: 만남
                    </p>
                    <div className="bg-sage-600 text-white px-3 py-2 rounded-md shadow-md transform -translate-x-2">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <PenLine size={14} /> 2장: 출발
                      </p>
                    </div>
                    <p className="text-sm text-stone-400 py-1 flex items-center gap-2">
                      <FileText size={14} /> 3장: 우연한 조우
                    </p>
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <div className="prose prose-stone max-w-none">
                    <p className="text-2xl text-stone-800 leading-relaxed font-serif tracking-tight">
                      "이 검을 가져가거라." 노인이 떨리는 손으로 상자를 건넸다.
                      <br />
                      <span className="inline-block mt-4 bg-sage-500 text-white px-3 py-1 rounded-full text-xs font-mono font-bold shadow-sm">
                        @복선:전설의_검
                      </span>
                    </p>
                    <p className="text-2xl text-stone-800 leading-relaxed font-serif pt-6 border-t border-stone-50">
                      주인공은 아직 이 검의 진정한 가치를 알지 못했다. 그것이
                      부서진 세상을 다시 잇게 될 유일한 열쇠라는 것을...
                    </p>
                  </div>
                  <div className="pt-8 flex flex-wrap gap-3">
                    <span className="px-4 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold border border-stone-200/50">
                      #캐릭터:카엘
                    </span>
                    <span className="px-4 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-bold border border-stone-200/50">
                      #장소:은빛_숲
                    </span>
                    <span className="px-4 py-1.5 bg-sage-50 text-sage-600 rounded-lg text-xs font-bold border border-sage-200">
                      #아이템:성검
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white border-y border-stone-100 overflow-hidden">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-ink mb-6 font-heading">
              창작에만 집중할 수 있는 환경
            </h2>
            <div className="w-20 h-1.5 bg-sage-500 mx-auto rounded-full mb-8 shadow-sm" />
            <p className="text-xl text-stone-500 max-w-2xl mx-auto font-light">
              이야기의 파편들을 StoLink가 연결해 드립니다.
              <br className="hidden sm:block" />
              당신은 그저 상상력을 펼치기만 하세요.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-12">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="p-10 rounded-3xl bg-white border border-stone-100 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.1)] hover:border-sage-200 transition-all cursor-default group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sage-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:bg-sage-100 transition-colors" />
                <div className="w-16 h-16 rounded-2xl bg-sage-50 flex items-center justify-center mb-8 border border-sage-100 group-hover:bg-sage-500 group-hover:shadow-lg group-hover:shadow-sage-200 transition-all transform group-hover:rotate-6">
                  <feature.icon className="h-8 w-8 text-sage-600 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-ink mb-4 font-heading group-hover:text-sage-700 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-stone-500 leading-relaxed font-light">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats / Social Proof Section */}
      <section className="py-24 px-4 bg-ink">
        <motion.div
          className="max-w-5xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-heading">
            창작자들이 선택한 이유
          </h2>
          <p className="text-stone-400 mb-16 text-lg font-light">
            StoLink와 함께라면, 이야기에만 집중할 수 있습니다.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-bold text-sage-400 font-heading">
                50%
              </p>
              <p className="text-stone-400 text-sm">시간 절약</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-bold text-sage-400 font-heading">
                ∞
              </p>
              <p className="text-stone-400 text-sm">무제한 작품</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-bold text-sage-400 font-heading">
                AI
              </p>
              <p className="text-stone-400 text-sm">스마트 분석</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl sm:text-5xl font-bold text-sage-400 font-heading">
                0원
              </p>
              <p className="text-stone-400 text-sm">시작 비용</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
