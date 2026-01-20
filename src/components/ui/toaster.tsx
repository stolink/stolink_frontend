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
    <div className="fixed top-20 right-6 z-[9999] flex flex-col items-end gap-3 pointer-events-none w-full max-w-[90vw] sm:max-w-[420px]">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onClick={() => dismiss(toast.id)}
            className={cn(
              "pointer-events-auto relative group cursor-pointer w-full rounded-2xl border p-4 shadow-paper-floating backdrop-blur-3xl transition-all hover:scale-[1.02] active:scale-[0.98]",
              "border-white/20",
              toast.variant === "destructive"
                ? "bg-error/90 text-white border-error/20"
                : toast.variant === "success"
                  ? "bg-sage-100/90 text-espresso-900 border-sage-200"
                  : "bg-cloud-50/90 text-espresso-900 border-cloud-100",
              toast.className, // User-provided class override
            )}
          >
            <div className="flex gap-3 text-left">
              {toast.variant === "destructive" ? (
                <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
              ) : toast.variant === "success" ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
              ) : (
                <Info className="w-5 h-5 shrink-0 text-mocha-500" />
              )}
              <div className="flex-1 space-y-1 pr-6">
                {toast.title && (
                  <h3
                    className={cn(
                      "font-semibold leading-none tracking-tight text-[15px]",
                      toast.variant === "destructive"
                        ? "text-white"
                        : "text-espresso-900",
                    )}
                  >
                    {toast.title}
                  </h3>
                )}
                {toast.description && (
                  <p
                    className={cn(
                      "text-sm leading-relaxed opacity-90",
                      toast.variant === "destructive"
                        ? "text-white/90"
                        : "text-espresso-900/70",
                    )}
                  >
                    {toast.description}
                  </p>
                )}
              </div>
            </div>
            {toast.action && <div className="pl-6">{toast.action}</div>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                dismiss(toast.id);
              }}
              className={cn(
                "absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-black/5 transition-all text-espresso-900/40",
                toast.variant === "destructive" &&
                  "hover:bg-white/10 text-white/40",
              )}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default Toaster;
