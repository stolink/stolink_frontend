/**
 * Toast UI Component - Warm & Soft Design System
 * Mocha palette integration for consistent brand experience
 */
import { useToastContainer, dismiss } from "@/hooks/useToast";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toasts = useToastContainer();

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center gap-3 pointer-events-none w-full max-w-[90vw] sm:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isDestructive = toast.variant === "destructive";
          const isSuccess = toast.variant === "success";

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={() => dismiss(toast.id)}
              className={cn(
                "pointer-events-auto relative group cursor-pointer w-full rounded-2xl border p-4 shadow-paper-floating backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
                isDestructive &&
                  "bg-red-50/90 border-red-200/60 text-red-900 shadow-red-900/5",
                isSuccess &&
                  "bg-sage-50/90 border-sage-200/60 text-sage-800 shadow-sage-900/5",
                !isDestructive &&
                  !isSuccess &&
                  "bg-white/90 border-mocha-200/40 text-espresso-900 shadow-mocha-900/5",
              )}
            >
              <div className="flex items-start gap-3 pr-6 text-left">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm",
                    isDestructive && "bg-red-100/80 text-red-600",
                    isSuccess && "bg-sage-100/80 text-sage-600",
                    !isDestructive &&
                      !isSuccess &&
                      "bg-mocha-100/80 text-mocha-600",
                  )}
                >
                  {isDestructive ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Info className="w-5 h-5" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <p
                    className={cn(
                      "font-heading font-bold text-sm leading-tight tracking-tight",
                      isDestructive && "text-red-950",
                      isSuccess && "text-sage-900",
                      !isDestructive && !isSuccess && "text-espresso-900",
                    )}
                  >
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p
                      className={cn(
                        "mt-1 text-xs leading-relaxed font-medium opacity-70",
                        isDestructive && "text-red-800",
                        isSuccess && "text-sage-700",
                        !isDestructive && !isSuccess && "text-mocha-800",
                      )}
                    >
                      {toast.description}
                    </p>
                  )}
                </div>

                {/* Close Button Hint */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dismiss(toast.id);
                  }}
                  className="absolute top-3 right-3 p-1 rounded-full opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-all"
                >
                  <X className="w-4 h-4 text-espresso-900/40" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default Toaster;
