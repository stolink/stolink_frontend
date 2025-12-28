/**
 * Shared Footer Component
 * 심플하고 일관된 푸터 디자인을 모든 페이지에서 재사용합니다.
 */

import { BrushStrokeDivider } from "@/components/effects";

interface FooterProps {
  className?: string;
}

export function Footer({ className = "" }: FooterProps) {
  return (
    <footer className={`bg-paper mt-auto ${className}`}>
      {/* Ver.4: 붓터치 형태의 상단 구분선 */}
      <BrushStrokeDivider className="text-stone-300" height={10} />
      <div className="py-6 px-6 border-t border-stone-100/50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/assets/main_logo.png"
              alt="Sto-Link"
              className="h-8 w-auto opacity-60"
            />
            <span className="text-stone-400 text-xs">v1.0.0</span>
          </div>
          <div className="flex items-center gap-6 text-stone-400 text-xs">
            <a href="#" className="hover:text-stone-600 transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-stone-600 transition-colors">
              개인정보처리방침
            </a>
            <span>© 2024 StoLink</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
