import { cva } from "class-variance-authority";

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-mocha-500 text-white hover:bg-mocha-400",
        secondary:
          "border-transparent bg-cloud-100 text-espresso-900 hover:bg-cloud-200",
        destructive:
          "border-transparent bg-status-error/15 text-status-error hover:bg-status-error/20",
        outline: "text-espresso-700 border-cloud-200",
        success: "border-transparent bg-sage-100 text-sage-700",
        warning: "border-transparent bg-mocha-100 text-status-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);
