import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  PenLine,
  GitBranch,
  Users,
  Sparkles,
  Image as ImageIcon,
  FileText,
  ArrowRight,
  BookOpen,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@stolink/ui";
import { Footer } from "@/components/common/Footer";
import { AuthModal } from "@/components/auth/AuthModal";
import { PaperTexture } from "@/components/effects/PaperTexture";
import { BrushStrokeDivider } from "@/components/effects/BrushStrokeDivider";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

export default function LandingPage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 500], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 500], [1, 0.5]);

  const features = [
    {
      icon: PenLine,
      title: "스마트 에디터",
      description:
        "마크다운 기반의 쾌적한 집필 환경.\n자동 저장으로 당신의 영감을 놓치지 않습니다.",
      colSpan: "md:col-span-2",
      bg: "bg-paper",
    },
    {
      icon: GitBranch,
      title: "복선 추적",
      description:
        "뿌려둔 복선이 어디서 회수되었는지,\n아직 미회수된 떡밥은 무엇인지 한눈에 파악하세요.",
      colSpan: "md:col-span-1",
      bg: "bg-sage-50",
    },
    {
      icon: Users,
      title: "인물 관계도",
      description:
        "복잡하게 얽힌 캐릭터들의 관계를\n직관적인 그래프로 시각화합니다.",
      colSpan: "md:col-span-1",
      bg: "bg-mocha-400/20",
    },
    {
      icon: Sparkles,
      title: "AI 일관성 체크",
      description:
        "설정 충돌과 개연성 오류를\nAI가 실시간으로 감지하고 제안합니다.",
      colSpan: "md:col-span-2",
      bg: "bg-paper",
    },
    {
      icon: ImageIcon,
      title: "장면 시각화",
      description:
        "글로 쓴 장면을 AI 이미지로 구현하여\n상상력을 더욱 구체화하세요.",
      colSpan: "md:col-span-1",
      bg: "bg-paper",
    },
    {
      icon: FileText,
      title: "다양한 내보내기",
      description: "PDF, EPUB, 마크다운 등\n원하는 형식으로 작품을 소장하세요.",
      colSpan: "md:col-span-2",
      bg: "bg-paper",
    },
  ];

  return (
    <div className="min-h-screen bg-paper font-sans selection:bg-mocha-400/30 selection:text-mocha-900 overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-paper/80 backdrop-blur-md border-b border-cloud-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <motion.img
              src="/assets/main_logo.png"
              alt="StoLink Mascot"
              className="h-12 w-auto drop-shadow-sm transition-transform group-hover:scale-105"
              whileHover={{ rotate: 10 }}
            />
            <span className="font-heading text-xl text-ink tracking-tight">
              StoLink
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Button
              intent="ghost"
              onClick={() => setIsAuthModalOpen(true)}
              className="font-medium text-mocha-700 hover:text-mocha-900 hover:bg-cloud-50"
            >
              로그인
            </Button>
            <Button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-mocha-500 hover:bg-mocha-500 text-white shadow-lg shadow-mocha-500/20 hover:shadow-mocha-500/40 transition-all active:scale-95"
            >
              무료로 시작하기
            </Button>
          </div>
        </div>
      </nav>

      <main className="relative">
        <PaperTexture opacity={0.4} />

        {/* Editoral Hero Section */}
        <section className="relative min-h-[90vh] flex items-center pt-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-paper via-paper/50 to-paper -z-10" />

          {/* Background Decorative Elements */}
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-mocha-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-20 w-[500px] h-[500px] bg-sage-200/20 rounded-full blur-3xl" />

          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
            <motion.div
              className="lg:col-span-7 relative z-10"
              style={{ y: heroY, opacity: heroOpacity }}
              initial="visible"
              animate="visible"
              variants={staggerContainer}
            >
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-paper border border-cloud-100 shadow-sm mb-8"
              >
                <span className="w-2 h-2 rounded-full bg-mocha-500 animate-pulse" />
                <span className="text-sm font-medium text-mocha-700">
                  작가들을 위한 Second Brain
                </span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-6xl sm:text-7xl lg:text-8xl font-heading font-bold text-ink leading-[0.9] tracking-tight mb-8"
              >
                <span className="block text-mocha-900">당신의 세계를</span>
                <span className="block text-mocha-400 italic  -ml-2">
                  기록하고,
                </span>
                <span className="block text-mocha-500">연결하세요.</span>
              </motion.h1>

              <motion.p
                variants={fadeInUp}
                className="text-xl text-mocha-700/80 mb-10 max-w-xl leading-relaxed font-light"
              >
                흩어진 설정과 복선을 하나의 거대한 세계관으로 엮어냅니다.
                <br />
                StoLink는 당신의 상상이 걸작이 되는 모든 과정을 함께합니다.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-lg bg-mocha-900 text-paper hover:bg-mocha-900/90 shadow-xl shadow-mocha-900/10 hover:shadow-mocha-900/20 transition-all group"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  집필 시작하기
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link to="/demo">
                  <Button
                    intent="secondary"
                    size="lg"
                    className="h-14 px-8 text-lg border-cloud-200 hover:bg-cloud-50 hover:border-cloud-300 text-mocha-700 bg-paper/50 backdrop-blur-sm"
                  >
                    체험해보기
                  </Button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Floating Visual Element */}
            <motion.div
              className="lg:col-span-5 relative hidden lg:block h-[600px]"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Mascot Floating - Added as requested */}
                <motion.div
                  className="absolute -top-10 -right-10 z-30 w-40 h-40 filter drop-shadow-lg"
                  animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                >
                  <img
                    src="/assets/main_logo.png"
                    alt="Mascot"
                    className="w-full h-full object-contain"
                  />
                </motion.div>

                {/* Abstract Book/Page composition */}
                <motion.div
                  className="w-80 h-[480px] bg-paper rounded-r-2xl rounded-l-md shadow-2xl border border-cloud-100 absolute top-10 left-10 rotate-[-6deg]"
                  animate={{ y: [0, -20, 0], rotate: [-6, -4, -6] }}
                  transition={{
                    repeat: Infinity,
                    duration: 6,
                    ease: "easeInOut",
                  }}
                >
                  <div className="p-8 space-y-4 opacity-50">
                    <div className="h-4 bg-cloud-100 rounded w-1/3" />
                    <div className="h-2 bg-cloud-50 rounded w-full" />
                    <div className="h-2 bg-cloud-50 rounded w-5/6" />
                    <div className="h-2 bg-cloud-50 rounded w-4/5" />
                  </div>
                </motion.div>

                <motion.div
                  className="w-80 h-[480px] bg-paper rounded-r-2xl rounded-l-md shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-cloud-100 absolute z-10"
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
                >
                  <div className="bg-cloud-50/50 p-6 border-b border-cloud-100 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-status-error/80" />
                      <div className="w-2 h-2 rounded-full bg-status-warning/80" />
                      <div className="w-2 h-2 rounded-full bg-status-success/80" />
                    </div>
                  </div>
                  <div className="p-8  leading-loose text-lg text-mocha-900">
                    <span className="bg-sage-100 text-sage-800 px-1 rounded">
                      그날 밤
                    </span>
                    , 숲은 평소보다 더 고요했다. 마치{" "}
                    <span className="bg-mocha-400/20 px-1 -mx-0.5 rounded-sm text-mocha-900 font-medium decoration-mocha-400 decoration-2 underline underline-offset-4">
                      오래된 약속
                    </span>
                    이 깨지기를 기다리는 것처럼...
                  </div>
                </motion.div>

                {/* Floating Tags */}
                <motion.div
                  className="absolute -right-4 top-1/3 bg-paper px-4 py-2 rounded-lg shadow-lg border border-cloud-100 text-sm font-bold text-mocha-500 z-20"
                  animate={{ y: [0, 10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  }}
                >
                  #복선:오래된_약속
                </motion.div>
                <motion.div
                  className="absolute -left-8 bottom-1/3 bg-doechii-2/10 px-4 py-2 rounded-lg shadow-lg border border-doechii-2/20 text-sm font-bold text-doechii-2 z-20"
                  animate={{ y: [0, -10, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 4.5,
                    ease: "easeInOut",
                    delay: 1,
                  }}
                >
                  @인물:숨겨진_조력자
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <BrushStrokeDivider className="text-cloud-100" height={16} />

        {/* Features Bento Grid */}
        <section className="py-24 px-6 relative bg-paper">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <h2 className="text-4xl lg:text-5xl font-heading font-bold text-ink mb-6">
                창작의 모든 순간을
                <br />
                <span className="text-mocha-500 italic ">우아하게</span>{" "}
                지원합니다
              </h2>
              <p className="text-lg text-muted-foreground font-light max-w-2xl mx-auto">
                복잡한 설정 관리는 StoLink에 맡기고,
                <br className="hidden sm:block" />
                당신은 오직 이야기의 흐름에만 집중하세요.
              </p>
            </motion.div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]"
              variants={staggerContainer}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
            >
              {features.map((feature, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  className={cn(
                    "relative group overflow-hidden rounded-3xl p-8 border border-border shadow-sm hover:shadow-paper-floating transition-all duration-500",
                    feature.colSpan,
                    feature.bg
                  )}
                >
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-paper border border-cloud-100 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                        <feature.icon className="w-6 h-6 text-mocha-500" />
                      </div>
                      <h3 className="text-2xl font-bold font-heading text-ink mb-3 group-hover:text-mocha-700 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {feature.description}
                      </p>
                    </div>

                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                      <div className="w-10 h-10 rounded-full bg-cloud-50 flex items-center justify-center">
                        <ArrowRight className="w-5 h-5 text-mocha-500" />
                      </div>
                    </div>
                  </div>

                  {/* Decorative Background Icon */}
                  <feature.icon
                    className="absolute -bottom-8 -right-8 w-64 h-64 text-ink/[0.02] transform rotate-12 group-hover:rotate-6 transition-transform duration-700"
                    strokeWidth={1}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Premium CTA Section */}
        <section className="py-32 px-6 relative overflow-hidden bg-ink text-paper">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 to-transparent" />

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <BookOpen
                className="w-16 h-16 text-mocha-400 mx-auto mb-8"
                strokeWidth={1.5}
              />
              <h2 className="text-4xl md:text-6xl font-heading font-bold mb-8 leading-tight">
                당신의 이야기는
                <br />
                <span className="text-mocha-400">여기서 완성됩니다.</span>
              </h2>
              <p className="text-xl text-cloud-200 mb-12 font-light max-w-2xl mx-auto">
                지금 바로 5,000명 이상의 작가들과 함께
                <br />더 체계적이고 몰입감 있는 집필을 경험해보세요.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button
                  size="lg"
                  className="w-full sm:w-auto h-16 px-10 text-xl font-bold bg-mocha-500 hover:bg-mocha-400 text-white shadow-[0_0_40px_theme(colors.mocha.500/30)] hover:shadow-[0_0_60px_theme(colors.mocha.500/50)] transition-all transform hover:-translate-y-1"
                  onClick={() => setIsAuthModalOpen(true)}
                >
                  무료로 시작하기
                </Button>
                <div className="text-sm text-cloud-200/60">
                  * 신용카드 정보 입력 없음
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
        <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
      </main>
    </div>
  );
}
