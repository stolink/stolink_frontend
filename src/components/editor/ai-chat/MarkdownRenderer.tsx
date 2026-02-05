import { useMemo, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import { resolveImageUrl } from "@/utils/imageUtils";
import type { Character } from "@/types/character";
import { cn } from "@/lib/utils";

// react-markdown 컴포넌트 props 타입 정의
interface MarkdownComponentProps {
  children?: ReactNode;
  href?: string;
  className?: string;
}

interface TagClickHandler {
  type: "character" | "conflict" | "event";
  label: string;
  character?: Character;
}

interface MarkdownRendererProps {
  content: string;
  characters?: Character[];
  className?: string;
  onTagClick?: (tag: TagClickHandler) => void;
}

/**
 * Custom renderer for Chatbot responses.
 * Handles Markdown formatting and custom tags ([#Conflict], [@Character], [!Event])
 * by hijacking Markdown links.
 */
export function MarkdownRenderer({
  content,
  characters = [],
  className,
  onTagClick,
}: MarkdownRendererProps) {
  // Pre-process content to convert custom tags into unique link formats
  // We use specific protocols like 'match:conflict/' to identify them in the renderer
  const processedContent = useMemo(() => {
    let text = content;

    // Pre-process: Clean up raw LLM artifacts like 'Name'(char-ID)
    // Matches: 'Name'(char-...) or Name(char-...)
    // Replaces with: [@Name]
    text = text.replace(
      /(['"]?)([^'"\s()]+)\1\s*\(char-[^)]+\)/g,
      (_, _quote, name) => {
        return `[@${name}]`;
      },
    );

    // 0-1. Handle raw error/warning tags from AI (e.g., ⚠️ [TIMELINE_CONFLICT])
    // These often come as uppercase codes. We convert them to conflict tags.
    text = text.replace(
      /(?:⚠️|Warning:|Error:)?\s*\[([A-Z][A-Z0-9_]*_CONFLICT|[A-Z][A-Z0-9_]*_ERROR|[A-Z0-9_]{5,})\]/g,
      (_, label) => {
        return `[#${label}]`;
      },
    );

    // 0. Loose Match Support for Characters
    // If AI generates "@Name" without brackets, wrap them in brackets so the next step catches them.
    if (characters.length > 0) {
      // Sort names by length (desc) to match longest names first (e.g., match "Kim Min" before "Kim")
      const names = characters
        .map((c) => c.profile.name)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);

      if (names.length > 0) {
        // Create regex to match @Name not preceded by [ or already in brackets
        const namePattern = names
          .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("|");
        // Match @Name that's not already in brackets - use word boundary approach
        const looseRegex = new RegExp(
          `(?:^|[^\\[])@(${namePattern})(?![^\\[]*\\])`,
          "g",
        );
        text = text.replace(looseRegex, (match, name) => {
          // Preserve the character before @ if it exists
          const prefix = match.startsWith("@") ? "" : match[0];
          return `${prefix}[@${name}]`;
        });
      }
    }

    // 1. Generic Loose Match for remaining tags (#Tag, !Event, @Unknown)
    // Matches: #Tag, !Tag, @Tag followed by word characters (including Korean)
    // Use a safer approach without lookbehind for broader browser compatibility
    text = text.replace(
      /(?:^|[^[])([#@!])([\w\u3131-\uD79D]+)/g,
      (match, prefix, word) => {
        // Check if this is already inside brackets by looking at context
        const charBefore = match[0] === prefix ? "" : match[0];
        return `${charBefore}[${prefix}${word}]`;
      },
    );

    // 2. Convert bracketed tags to markdown links
    // Handle various prefix formats: [#Conflict:Label], [#Label], [@Character:Name], [@Name], etc.
    return text
      .replace(/\[#([^\]]+)\]/g, (_, val) => {
        // Remove common prefixes: "Conflict:", "갈등:", etc.
        const cleanVal = val
          .replace(/^(?:Conflict|갈등|개연성|문제):\s*/i, "")
          .trim();
        return `[${cleanVal}](match:conflict/${encodeURIComponent(cleanVal)})`;
      })
      .replace(/\[@([^\]]+)\]/g, (_, val) => {
        // Remove common prefixes: "Character:", "캐릭터:", etc.
        const cleanVal = val
          .replace(/^(?:Character|캐릭터|인물):\s*/i, "")
          .trim();
        return `[${cleanVal}](match:character/${encodeURIComponent(cleanVal)})`;
      })
      .replace(/\[!([^\]]+)\]/g, (_, val) => {
        // Remove common prefixes: "Event:", "이벤트:", "사건:", etc.
        const cleanVal = val.replace(/^(?:Event|이벤트|사건):\s*/i, "").trim();
        return `[${cleanVal}](match:event/${encodeURIComponent(cleanVal)})`;
      });
  }, [content, characters]);

  return (
    <div
      className={cn(
        "prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 break-words",
        className,
      )}
    >
      <ReactMarkdown
        components={{
          // Override anchor tag to render chips for specific matching URLs
          a: ({ href, children, ...props }: MarkdownComponentProps) => {
            if (!href) return <a {...props}>{children}</a>;

            if (href.startsWith("match:conflict/")) {
              const label = decodeURIComponent(
                href.replace("match:conflict/", ""),
              ).replace(/^[#]/, "");
              return (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => onTagClick?.({ type: "conflict", label })}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    onTagClick?.({ type: "conflict", label })
                  }
                  className="inline-flex items-center px-3 py-1.5 mx-0.5 text-sm font-semibold tracking-wide text-rose-700 bg-gradient-to-br from-rose-50/90 via-white/60 to-rose-50/20 border border-rose-200/60 rounded-full shadow-sm select-none align-middle hover:shadow-md hover:scale-105 hover:border-rose-300 active:scale-100 transition-all cursor-pointer no-underline"
                >
                  {label}
                </span>
              );
            }

            if (href.startsWith("match:character/")) {
              const label = decodeURIComponent(
                href.replace("match:character/", ""),
              ).replace(/^[@]/, "");
              const char = characters.find((c) => c.profile?.name === label);
              const imageUrl = char?.imageUrl;

              return (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() =>
                    onTagClick?.({ type: "character", label, character: char })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    onTagClick?.({ type: "character", label, character: char })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 mx-0.5 text-sm font-semibold tracking-wide text-sage-700 bg-gradient-to-br from-sage-50/90 via-white/60 to-sage-50/20 border border-sage-200/60 rounded-full shadow-sm select-none align-middle hover:shadow-md hover:scale-105 hover:border-sage-300 active:scale-100 transition-all cursor-pointer no-underline"
                >
                  {imageUrl && (
                    <img
                      src={resolveImageUrl(imageUrl)}
                      alt={label}
                      className="w-4 h-4 rounded-full object-cover border border-sage-200/50 -ml-0.5"
                    />
                  )}
                  {label}
                </span>
              );
            }

            if (href.startsWith("match:event/")) {
              const label = decodeURIComponent(
                href.replace("match:event/", ""),
              ).replace(/^[!]/, "");
              return (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => onTagClick?.({ type: "event", label })}
                  onKeyDown={(e) =>
                    e.key === "Enter" && onTagClick?.({ type: "event", label })
                  }
                  className="inline-flex items-center px-3 py-1.5 mx-0.5 text-sm font-semibold tracking-wide text-mocha-700 bg-gradient-to-br from-mocha-50/90 via-white/60 to-mocha-50/20 border border-mocha-200/60 rounded-full shadow-sm select-none align-middle hover:shadow-md hover:scale-105 hover:border-mocha-300 active:scale-100 transition-all cursor-pointer no-underline"
                >
                  {label}
                </span>
              );
            }

            // Default link styling (if AI produces actual links)
            return (
              <a
                href={href}
                className="text-mocha-600 underline decoration-mocha-300 underline-offset-2 hover:text-mocha-800"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
          // Custom styling for other elements
          p: ({ children }: MarkdownComponentProps) => (
            <p className="mb-2 last:mb-0 leading-[1.7] text-espresso-800">
              {children}
            </p>
          ),
          strong: ({ children }: MarkdownComponentProps) => (
            <strong className="font-bold text-espresso-900">{children}</strong>
          ),
          ul: ({ children }: MarkdownComponentProps) => (
            <ul className="list-disc pl-5 space-y-1 mb-2 marker:text-mocha-300">
              {children}
            </ul>
          ),
          ol: ({ children }: MarkdownComponentProps) => (
            <ol className="list-decimal pl-5 space-y-1 mb-2 marker:text-mocha-400">
              {children}
            </ol>
          ),
          blockquote: ({ children }: MarkdownComponentProps) => (
            <blockquote className="border-l-2 border-mocha-200 pl-4 py-1 my-2 bg-mocha-50/30 italic text-mocha-700 rounded-r-lg">
              {children}
            </blockquote>
          ),
          code: ({ children, className }: MarkdownComponentProps) => {
            // Check if it's inline code or block
            const isInline = !className?.includes("language-");
            if (isInline) {
              return (
                <code className="px-1.5 py-0.5 bg-mocha-100/50 text-espresso-800 rounded text-[0.85em] font-mono tracking-tight">
                  {children}
                </code>
              );
            }
            return (
              <div className="rounded-lg bg-espresso-900 p-3 my-2 text-mocha-100 text-xs font-mono overflow-x-auto shadow-inner">
                <code>{children}</code>
              </div>
            );
          },
          // Disable pre styling since we handle code block in `code` (or let pre be wrapper)
          pre: ({ children }: MarkdownComponentProps) => (
            <pre className="not-prose m-0 bg-transparent">{children}</pre>
          ),
          h1: ({ children }: MarkdownComponentProps) => (
            <h1 className="text-xl font-bold text-espresso-900 mt-4 mb-2 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }: MarkdownComponentProps) => (
            <h2 className="text-lg font-bold text-espresso-800 mt-3 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }: MarkdownComponentProps) => (
            <h3 className="text-base font-bold text-espresso-800 mt-3 mb-1">
              {children}
            </h3>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
