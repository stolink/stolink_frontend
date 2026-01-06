/**
 * Werner Bronkhorst 스타일 인물 일대기 - 횡스크롤 버전
 * - 노드가 굽이치는 길을 따라 배치
 * - 팻말/미니어처 스타일 노드
 * - 스크롤 기반 등장 애니메이션
 */
import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import type { BiographyEvent } from "@/types/biography";
import { getImportanceLevel } from "@/types/biography";
import { getEventTypeIcon, getEventTypeConfig } from "./constants";
import { createElement } from "react";
import {
  X,
  Calendar,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { sortEventsByPrevId } from "./utils"; // Import here

interface BiographyTreeProps {
  events: BiographyEvent[];
  backstory?: string;
  className?: string;
  selectedEventId: string | null;
  onEventClick: (eventId: string) => void;
}

const CONTAINER_PADDING = 100;

// 배경 이미지(biography-bg-horizontal.png)의 패턴 주기에 맞춰 노드 위치 계산
// 캘리브레이션 완료된 값 (2026-01-04)
const CYCLE = 490;
const AMP = 9;
const PHASE = 0;
const OFFSET = 38;
const BG_OFFSET = 90;
const SPACING = 135; // 노드 간격

// 노드 Y 좌표 계산 함수
function getPathY(x: number): number {
  const phase = (x / CYCLE) * Math.PI * 2 + PHASE;
  const waveY = Math.sin(phase) * AMP;
  return OFFSET + waveY;
}

export function BiographyTree({
  events,
  className,
  selectedEventId,
  onEventClick,
}: BiographyTreeProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedEvents = sortEventsByPrevId(events);
  const selectedEvent =
    sortedEvents.find((e) => e.eventId === selectedEventId) ?? null;
  const selectedIndex = selectedEvent
    ? sortedEvents.findIndex((e) => e.eventId === selectedEventId)
    : -1;

  // 컨텐츠 전체 너비
  const contentWidth = Math.max(
    sortedEvents.length * SPACING + CONTAINER_PADDING * 2,
    800,
  );

  const handleNodeClick = useCallback(
    (eventId: string) => {
      onEventClick(eventId);
      setDetailOpen(true);
    },
    [onEventClick],
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
  }, []);

  // 선택된 노드로 스크롤
  useEffect(() => {
    if (selectedIndex >= 0 && scrollContainerRef.current) {
      const scrollPos = Math.max(0, selectedIndex * SPACING - 300); // Center a bit more
      scrollContainerRef.current.scrollTo({
        left: scrollPos,
        behavior: "smooth",
      });
    }
  }, [selectedIndex]);

  return (
    <div
      className={cn(
        "relative w-full h-[500px] rounded-2xl overflow-hidden border border-stone-200/60 shadow-paper bg-cloud-50",
        className,
      )}
    >
      {/* 타임라인 방향 표시 */}
      <div className="absolute left-3 top-3 z-30 bg-white/40 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-sm border border-white/40 group transition-all hover:bg-white/60">
        <span className="text-xs font-serif font-medium text-espresso-900/80 group-hover:text-espresso-900 transition-colors">
          ← 과거
        </span>
      </div>
      <div className="absolute right-3 top-3 z-30 bg-white/40 backdrop-blur-md rounded-lg px-3 py-1.5 shadow-sm border border-white/40 group transition-all hover:bg-white/60">
        <span className="text-xs font-serif font-medium text-espresso-900/80 group-hover:text-espresso-900 transition-colors">
          현재 →
        </span>
      </div>

      {/* 스크롤 가능한 메인 영역 */}
      <div
        ref={scrollContainerRef}
        className="absolute inset-0 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div
          className="relative h-full"
          style={{ width: contentWidth, minWidth: "100%" }}
        >
          {/* 배경 이미지 (고정된 주기로 반복) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/images/biography-bg-horizontal.png')",
              backgroundRepeat: "repeat-x",
              backgroundSize: "auto 100%", // 비율 유지
              backgroundPosition: `${BG_OFFSET}px center`, // 배경 위치 보정
            }}
          />

          {/* 노드들 */}
          {sortedEvents.map((event, index) => {
            const x = CONTAINER_PADDING + index * SPACING;
            const y = getPathY(x); // x좌표 기반 높이 계산
            return (
              <SignpostNode
                key={event.eventId}
                event={event}
                index={index}
                isSelected={selectedEventId === event.eventId}
                onClick={() => handleNodeClick(event.eventId)}
                x={x}
                y={y}
              />
            );
          })}
        </div>
      </div>

      {/* 상세 패널 (모달) */}
      <AnimatePresence>
        {detailOpen && selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
            onClick={closeDetail}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-[90%] max-w-[480px] max-h-[85%] bg-white rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* 헤더 */}
              <div
                className="flex items-center justify-between p-4 border-b border-stone-100"
                style={{
                  backgroundColor:
                    getEventTypeConfig(selectedEvent.eventType).accentColor +
                    "20",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: getEventTypeConfig(
                        selectedEvent.eventType,
                      ).accentColor,
                    }}
                  >
                    {createElement(getEventTypeIcon(selectedEvent.eventType), {
                      className: "w-5 h-5 text-white",
                    })}
                  </div>
                  <div>
                    <span className="text-xs font-medium text-stone-500">
                      #{selectedIndex + 1} ·{" "}
                      {getEventTypeConfig(selectedEvent.eventType).label}
                    </span>
                  </div>
                </div>
                <button
                  onClick={closeDetail}
                  className="p-2 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              {/* 내용 */}
              <div className="p-5 space-y-4 overflow-y-auto max-h-[350px]">
                <h3 className="text-xl font-bold text-stone-800">
                  {selectedEvent.narrativeSummary}
                  {getImportanceLevel(selectedEvent.importance) === "major" && (
                    <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      ⭐ 주요
                    </span>
                  )}
                </h3>

                <div className="flex flex-wrap gap-3 text-sm text-stone-500">
                  {selectedEvent.timestamp && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>{selectedEvent.timestamp}</span>
                    </div>
                  )}
                  {selectedEvent.locationRef && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      <span>{selectedEvent.locationRef}</span>
                    </div>
                  )}
                </div>

                {selectedEvent.participants.length > 0 && (
                  <div className="bg-stone-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-stone-400" />
                      <span className="text-sm font-medium text-stone-600">
                        참여 인물
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedEvent.participants.map((p, i) => (
                        <span
                          key={i}
                          className="text-sm px-2 py-0.5 bg-white rounded-full border border-stone-200 text-stone-700"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-stone-700 leading-relaxed">
                  {selectedEvent.description || "상세 설명이 없습니다."}
                </p>

                {selectedEvent.visualScene && (
                  <div className="bg-mocha-50 rounded-xl p-4 border border-mocha-100">
                    <h4 className="text-sm font-semibold text-mocha-700 mb-1">
                      🎬 장면 묘사
                    </h4>
                    <p className="text-sm text-mocha-600 italic">
                      "{selectedEvent.visualScene}"
                    </p>
                  </div>
                )}
              </div>

              {/* 네비게이션 */}
              <div className="p-3 border-t border-stone-100 flex items-center justify-between bg-stone-50">
                <button
                  onClick={() => {
                    if (selectedIndex > 0) {
                      onEventClick(sortedEvents[selectedIndex - 1].eventId);
                    }
                  }}
                  disabled={selectedIndex === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> 이전
                </button>
                <span className="text-xs text-stone-400">
                  {selectedIndex + 1} / {sortedEvents.length}
                </span>
                <button
                  onClick={() => {
                    if (selectedIndex < sortedEvents.length - 1) {
                      onEventClick(sortedEvents[selectedIndex + 1].eventId);
                    }
                  }}
                  disabled={selectedIndex === sortedEvents.length - 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-stone-600 hover:bg-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  다음 <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** 팻말 스타일 노드 */
function SignpostNode({
  event,
  index,
  isSelected,
  onClick,
  x,
  y,
}: {
  event: BiographyEvent;
  index: number;
  isSelected: boolean;
  onClick: () => void;
  x: number;
  y: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: false, margin: "-50px" });

  const config = getEventTypeConfig(event.eventType);
  const isMajor = getImportanceLevel(event.importance) === "major";
  const nodeNumber = index + 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={
        isInView
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 30, scale: 0.8 }
      }
      transition={{
        delay: 0.05 * index,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      style={{
        position: "absolute",
        left: x,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      className="cursor-pointer group z-10"
      onClick={onClick}
    >
      {/* 번호 (팻말 위에 떠있는 텍스트) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-5 text-sm font-bold pointer-events-none"
        style={{
          color: config.color,
          textShadow:
            "0 1px 2px rgba(255,255,255,0.8), 0 0 8px rgba(255,255,255,0.6)",
        }}
      >
        {nodeNumber}
      </div>

      {/* 팻말 기둥 */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          width: 4,
          height: 35,
          top: "100%",
          background: `linear-gradient(to bottom, #8B7355 0%, #5C4A3A 100%)`,
          borderRadius: 2,
          boxShadow: "1px 2px 4px rgba(0,0,0,0.3)",
        }}
      />

      {/* 팻말 그림자 */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 30,
          height: 8,
          left: "50%",
          top: "calc(100% + 35px)",
          transform: "translateX(-50%)",
          background:
            "radial-gradient(ellipse, rgba(61,48,42,0.4) 0%, transparent 70%)",
          filter: "blur(2px)",
        }}
      />

      {/* 팻말 본체 */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: [-1, 1, -1, 0] }}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative flex items-center justify-center rounded-lg shadow-lg transition-all",
          isSelected && "ring-2 ring-white ring-offset-2",
        )}
        style={{
          width: isMajor ? 44 : 36,
          height: isMajor ? 44 : 36,
          background: `linear-gradient(145deg, ${config.accentColor}, ${config.color})`,
          boxShadow: `
            inset 2px 2px 4px rgba(255,255,255,0.3),
            inset -1px -1px 2px rgba(0,0,0,0.1),
            3px 5px 10px rgba(0,0,0,0.25)
          `,
          border: "2px solid rgba(255,255,255,0.4)",
          borderRadius: "8px",
        }}
      >
        {/* 아이콘 */}
        {createElement(getEventTypeIcon(event.eventType), {
          className: cn("text-white", isMajor ? "w-5 h-5" : "w-4 h-4"),
        })}

        {/* 주요 사건 뱃지 */}
        {isMajor && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white shadow" />
        )}
      </motion.div>

      {/* 호버 라벨 */}
      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-12 px-3 py-1.5 bg-stone-900/90 backdrop-blur-sm rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg">
        {event.narrativeSummary.slice(0, 20)}...
        <div className="absolute left-1/2 -translate-x-1/2 -top-1 border-4 border-transparent border-b-stone-900/90" />
      </div>
    </motion.div>
  );
}
