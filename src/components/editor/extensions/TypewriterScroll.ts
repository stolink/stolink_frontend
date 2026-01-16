import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export type TypewriterPosition = "center" | "top" | "bottom" | "off";

export interface TypewriterScrollOptions {
  /**
   * Scroll position for the cursor
   * - center: 40% from top (default)
   * - top: 20% from top
   * - bottom: 70% from top
   * - off: disabled
   */
  position: TypewriterPosition;
  /**
   * Enable smooth scrolling animation
   */
  smoothScroll: boolean;
  /**
   * Threshold in pixels to prevent jitter
   */
  threshold: number;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    typewriterScroll: {
      setTypewriterPosition: (position: TypewriterPosition) => ReturnType;
      toggleTypewriter: () => ReturnType;
    };
  }
}

const POSITION_RATIOS: Record<Exclude<TypewriterPosition, "off">, number> = {
  center: 0.4,
  top: 0.2,
  bottom: 0.7,
};

export const TypewriterScroll = Extension.create<TypewriterScrollOptions>({
  name: "typewriterScroll",

  addOptions() {
    return {
      position: "off",
      smoothScroll: true,
      threshold: 5,
    };
  },

  addStorage() {
    return {
      isAutoScrolling: false,
      // Use storage for runtime-changeable position (options is immutable)
      currentPosition: this.options.position as TypewriterPosition,
    };
  },

  addCommands() {
    return {
      setTypewriterPosition:
        (position: TypewriterPosition) =>
        ({ editor }) => {
          // Update storage instead of options (options is immutable after configure)
          this.storage.currentPosition = position;

          // Apply padding based on position
          const dom = editor.view.dom as HTMLElement;
          const containerParent =
            dom.closest(".ProseMirror")?.parentElement?.parentElement;

          if (position === "off") {
            dom.style.paddingTop = "";
            dom.style.paddingBottom = "";
            if (containerParent) {
              containerParent.style.paddingTop = "";
              containerParent.style.paddingBottom = "";
            }
          } else {
            const ratio = POSITION_RATIOS[position];
            // Add padding to create space for scroll centering
            dom.style.paddingTop = `${ratio * 50}vh`;
            dom.style.paddingBottom = `${(1 - ratio) * 50}vh`;
            if (containerParent) {
              containerParent.style.paddingTop = `${ratio * 20}vh`;
              containerParent.style.paddingBottom = `${(1 - ratio) * 20}vh`;
            }
          }

          return true;
        },
      toggleTypewriter:
        () =>
        ({ commands }) => {
          const positions: TypewriterPosition[] = [
            "off",
            "center",
            "top",
            "bottom",
          ];
          const currentIndex = positions.indexOf(this.storage.currentPosition);
          const nextIndex = (currentIndex + 1) % positions.length;
          return commands.setTypewriterPosition(positions[nextIndex]);
        },
    };
  },

  addProseMirrorPlugins() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const extension = this;

    return [
      new Plugin({
        key: new PluginKey("typewriterScroll"),
        view: () => ({
          update: (view) => {
            // Use storage.currentPosition instead of options.position (runtime changeable)
            if (extension.storage.currentPosition === "off") return;
            if (extension.storage.isAutoScrolling) return;

            const { selection } = view.state;
            const { from } = selection;

            requestAnimationFrame(() => {
              if (extension.storage.isAutoScrolling) return;

              try {
                const coords = view.coordsAtPos(from);
                const editorElement = view.dom.parentElement;

                if (!editorElement) return;

                // Find scrollable container
                let container: HTMLElement | null = editorElement;
                while (
                  container &&
                  container.scrollHeight <= container.clientHeight
                ) {
                  container = container.parentElement;
                }

                if (!container) return;

                const containerRect = container.getBoundingClientRect();
                const ratio =
                  POSITION_RATIOS[
                    extension.storage.currentPosition as Exclude<
                      TypewriterPosition,
                      "off"
                    >
                  ] || 0.4;
                const targetY = containerRect.height * ratio;
                const cursorRelativeY = coords.top - containerRect.top;
                const scrollOffset = cursorRelativeY - targetY;

                if (Math.abs(scrollOffset) > extension.options.threshold) {
                  extension.storage.isAutoScrolling = true;

                  if (extension.options.smoothScroll) {
                    container.scrollBy({
                      top: scrollOffset,
                      behavior: "smooth",
                    });
                  } else {
                    container.scrollTop += scrollOffset;
                  }

                  setTimeout(
                    () => {
                      extension.storage.isAutoScrolling = false;
                    },
                    extension.options.smoothScroll ? 150 : 50
                  );
                }
              } catch {
                extension.storage.isAutoScrolling = false;
              }
            });
          },
        }),
      }),
    ];
  },
});
