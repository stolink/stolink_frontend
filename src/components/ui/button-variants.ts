import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ease-organic focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default: "bg-mocha-500 text-white shadow-sm hover:bg-mocha-400",
        destructive:
          "bg-status-error text-white shadow-sm hover:bg-status-error/90",
        outline:
          "border border-cloud-300 bg-transparent text-espresso-700 hover:bg-cloud-50 hover:text-espresso-900",
        secondary:
          "bg-cloud-100 text-espresso-900 shadow-sm hover:bg-cloud-200",
        ghost: "text-espresso-700 hover:bg-cloud-100 hover:text-espresso-900",
        link: "text-mocha-500 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2",
        sm: "h-8 px-4 text-xs",
        lg: "h-11 px-8",
        icon: "h-9 w-9",
        "icon-sm": "h-icon-sm w-icon-sm p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
