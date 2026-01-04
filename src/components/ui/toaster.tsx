/**
 * Toast UI Component - Warm & Soft Design System
 * Mocha palette integration for consistent brand experience
 */
import { useToastContainer } from "@/hooks/useToast";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function Toaster() {
  const toasts = useToastContainer();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const isDestructive = toast.variant === "destructive";
          const isSuccess = toast.variant === "success";

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={cn(
                "pointer-events-auto min-w-[320px] max-w-[420px] rounded-xl border p-4 shadow-paper-floating backdrop-blur-md",
                isDestructive && "bg-red-50/95 border-red-200 text-red-900",
                isSuccess && "bg-sage-50/95 border-sage-200 text-sage-700",
                !isDestructive &&
                  !isSuccess &&
                  "bg-white/95 border-mocha-200/60 text-espresso-900"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                    isDestructive && "bg-red-100 text-red-600",
                    isSuccess && "bg-sage-100 text-sage-600",
                    !isDestructive &&
                      !isSuccess &&
                      "bg-mocha-100 text-mocha-600"
                  )}
                >
                  {isDestructive ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : isSuccess ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-heading font-semibold text-sm leading-tight",
                      isDestructive && "text-red-900",
                      isSuccess && "text-sage-700",
                      !isDestructive && !isSuccess && "text-espresso-900"
                    )}
                  >
                    {toast.title}
                  </p>
                  {toast.description && (
                    <p
                      className={cn(
                        "mt-1 text-sm leading-relaxed opacity-80",
                        isDestructive && "text-red-700",
                        isSuccess && "text-sage-600",
                        !isDestructive && !isSuccess && "text-stone-600"
                      )}
                    >
                      {toast.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default Toaster;
