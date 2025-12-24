import { cn } from "@/lib/utils";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Toggle({
  checked,
  onChange,
  disabled = false,
  size = "md",
}: ToggleProps) {
  const sizeClasses = {
    sm: {
      track: "h-5 w-9",
      thumb: "h-4 w-4",
      translate: "translate-x-4",
    },
    md: {
      track: "h-6 w-11",
      thumb: "h-5 w-5",
      translate: "translate-x-5",
    },
  };

  const { track, thumb, translate } = sizeClasses[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-500 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        track,
        checked ? "bg-sage-500" : "bg-stone-200",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block transform rounded-full bg-white shadow-lg ring-0",
          "transition duration-200 ease-in-out",
          thumb,
          checked ? translate : "translate-x-0",
        )}
      />
    </button>
  );
}
