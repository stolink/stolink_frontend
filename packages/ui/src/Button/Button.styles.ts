import { cva } from "../utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      intent: {
        primary:
          "bg-mocha-500 text-white hover:bg-mocha-400 shadow-md hover:shadow-lg",
        secondary:
          "bg-cloud-100 text-espresso-900 hover:bg-cloud-200 border border-cloud-200",
        ghost: "hover:bg-mocha-500/10 text-mocha-900 border-transparent",
        destructive: "bg-status-error text-white hover:bg-status-error/90",
        outline: "border border-mocha-500 text-mocha-500 hover:bg-mocha-50",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-8 text-lg",
        icon: "h-10 w-10",
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
        square: "rounded-none",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
      shape: "default",
    },
  },
);
