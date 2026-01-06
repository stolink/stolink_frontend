import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      intent: {
        primary:
          "border-transparent bg-mocha-500 text-white hover:bg-mocha-400",
        secondary:
          "border-transparent bg-cloud-100 text-espresso-900 hover:bg-cloud-200",
        destructive:
          "border-transparent bg-status-error text-white hover:bg-status-error/80",
        outline: "text-espresso-900 border-mocha-200",
        success: "border-transparent bg-status-success text-white",
        warning: "border-transparent bg-status-warning text-white",
      },
    },
    defaultVariants: {
      intent: "primary",
    },
  },
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, intent, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ intent }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
