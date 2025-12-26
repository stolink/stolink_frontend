import { cn } from "@/lib/utils";

interface TreeLinesProps {
  level: number;
  isLast: boolean;
  parentLines: boolean[];
}

/**
 * 트리 연결선 렌더링 컴포넌트
 */
export function TreeLines({ level, isLast, parentLines }: TreeLinesProps) {
  return (
    <>
      {/* 세로선 (부모 레벨들) */}
      {parentLines.map((showLine, idx) =>
        showLine ? (
          <div
            key={idx}
            className="absolute top-0 bottom-0 w-px bg-stone-300"
            style={{ left: `${idx * 16 + 11}px` }}
          />
        ) : null
      )}

      {/* 현재 레벨 연결 */}
      {level > 0 && (
        <>
          {/* 세로선 (현재) */}
          {!isLast && (
            <div
              className="absolute top-0 bottom-0 w-px bg-stone-300"
              style={{ left: `${(level - 1) * 16 + 11}px` }}
            />
          )}
          {/* 가로선 */}
          <div
            className="absolute w-3 border-t border-stone-300"
            style={{
              left: `${(level - 1) * 16 + 11}px`,
              top: "14px",
            }}
          />
          {isLast && (
            <div
              className="absolute w-px bg-stone-300"
              style={{
                left: `${(level - 1) * 16 + 11}px`,
                top: "0",
                height: "14px",
              }}
            />
          )}
        </>
      )}
    </>
  );
}
