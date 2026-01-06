// src/Button/Button.tsx
import * as React3 from "react";

// ../../node_modules/@radix-ui/react-slot/dist/index.mjs
import * as React2 from "react";

// ../../node_modules/@radix-ui/react-compose-refs/dist/index.mjs
import * as React from "react";
function setRef(ref, value) {
  if (typeof ref === "function") {
    return ref(value);
  } else if (ref !== null && ref !== void 0) {
    ref.current = value;
  }
}
function composeRefs(...refs) {
  return (node) => {
    let hasCleanup = false;
    const cleanups = refs.map((ref) => {
      const cleanup = setRef(ref, node);
      if (!hasCleanup && typeof cleanup == "function") {
        hasCleanup = true;
      }
      return cleanup;
    });
    if (hasCleanup) {
      return () => {
        for (let i = 0; i < cleanups.length; i++) {
          const cleanup = cleanups[i];
          if (typeof cleanup == "function") {
            cleanup();
          } else {
            setRef(refs[i], null);
          }
        }
      };
    }
  };
}

// ../../node_modules/@radix-ui/react-slot/dist/index.mjs
import { Fragment as Fragment2, jsx } from "react/jsx-runtime";
var REACT_LAZY_TYPE = /* @__PURE__ */ Symbol.for("react.lazy");
var use = React2[" use ".trim().toString()];
function isPromiseLike(value) {
  return typeof value === "object" && value !== null && "then" in value;
}
function isLazyComponent(element) {
  return element != null && typeof element === "object" && "$$typeof" in element && element.$$typeof === REACT_LAZY_TYPE && "_payload" in element && isPromiseLike(element._payload);
}
// @__NO_SIDE_EFFECTS__
function createSlot(ownerName) {
  const SlotClone = /* @__PURE__ */ createSlotClone(ownerName);
  const Slot2 = React2.forwardRef((props, forwardedRef) => {
    let { children, ...slotProps } = props;
    if (isLazyComponent(children) && typeof use === "function") {
      children = use(children._payload);
    }
    const childrenArray = React2.Children.toArray(children);
    const slottable = childrenArray.find(isSlottable);
    if (slottable) {
      const newElement = slottable.props.children;
      const newChildren = childrenArray.map((child) => {
        if (child === slottable) {
          if (React2.Children.count(newElement) > 1) return React2.Children.only(null);
          return React2.isValidElement(newElement) ? newElement.props.children : null;
        } else {
          return child;
        }
      });
      return /* @__PURE__ */ jsx(SlotClone, { ...slotProps, ref: forwardedRef, children: React2.isValidElement(newElement) ? React2.cloneElement(newElement, void 0, newChildren) : null });
    }
    return /* @__PURE__ */ jsx(SlotClone, { ...slotProps, ref: forwardedRef, children });
  });
  Slot2.displayName = `${ownerName}.Slot`;
  return Slot2;
}
var Slot = /* @__PURE__ */ createSlot("Slot");
// @__NO_SIDE_EFFECTS__
function createSlotClone(ownerName) {
  const SlotClone = React2.forwardRef((props, forwardedRef) => {
    let { children, ...slotProps } = props;
    if (isLazyComponent(children) && typeof use === "function") {
      children = use(children._payload);
    }
    if (React2.isValidElement(children)) {
      const childrenRef = getElementRef(children);
      const props2 = mergeProps(slotProps, children.props);
      if (children.type !== React2.Fragment) {
        props2.ref = forwardedRef ? composeRefs(forwardedRef, childrenRef) : childrenRef;
      }
      return React2.cloneElement(children, props2);
    }
    return React2.Children.count(children) > 1 ? React2.Children.only(null) : null;
  });
  SlotClone.displayName = `${ownerName}.SlotClone`;
  return SlotClone;
}
var SLOTTABLE_IDENTIFIER = /* @__PURE__ */ Symbol("radix.slottable");
function isSlottable(child) {
  return React2.isValidElement(child) && typeof child.type === "function" && "__radixId" in child.type && child.type.__radixId === SLOTTABLE_IDENTIFIER;
}
function mergeProps(slotProps, childProps) {
  const overrideProps = { ...childProps };
  for (const propName in childProps) {
    const slotPropValue = slotProps[propName];
    const childPropValue = childProps[propName];
    const isHandler = /^on[A-Z]/.test(propName);
    if (isHandler) {
      if (slotPropValue && childPropValue) {
        overrideProps[propName] = (...args) => {
          const result = childPropValue(...args);
          slotPropValue(...args);
          return result;
        };
      } else if (slotPropValue) {
        overrideProps[propName] = slotPropValue;
      }
    } else if (propName === "style") {
      overrideProps[propName] = { ...slotPropValue, ...childPropValue };
    } else if (propName === "className") {
      overrideProps[propName] = [slotPropValue, childPropValue].filter(Boolean).join(" ");
    }
  }
  return { ...slotProps, ...overrideProps };
}
function getElementRef(element) {
  var _a, _b;
  let getter = (_a = Object.getOwnPropertyDescriptor(element.props, "ref")) == null ? void 0 : _a.get;
  let mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.ref;
  }
  getter = (_b = Object.getOwnPropertyDescriptor(element, "ref")) == null ? void 0 : _b.get;
  mayWarn = getter && "isReactWarning" in getter && getter.isReactWarning;
  if (mayWarn) {
    return element.props.ref;
  }
  return element.props.ref || element.ref;
}

// src/Button/Button.tsx
import { Loader2 } from "lucide-react";

// src/utils.ts
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { cva } from "class-variance-authority";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// src/Button/Button.styles.ts
var buttonVariants = cva(
  "inline-flex items-center justify-center truncate rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      intent: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-8 text-lg",
        icon: "h-10 w-10"
      },
      shape: {
        default: "rounded-md",
        pill: "rounded-full",
        square: "rounded-none"
      }
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
      shape: "default"
    }
  }
);

// src/Button/Button.tsx
import { jsx as jsx2, jsxs } from "react/jsx-runtime";
var Button = React3.forwardRef(
  ({
    className,
    intent,
    size,
    shape,
    asChild = false,
    isLoading = false,
    loadingText,
    children,
    disabled,
    ...props
  }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsxs(
      Comp,
      {
        className: cn(buttonVariants({ intent, size, shape, className })),
        ref,
        disabled: isLoading || disabled,
        ...props,
        children: [
          isLoading && /* @__PURE__ */ jsx2(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }),
          isLoading ? loadingText || children : children
        ]
      }
    );
  }
);
Button.displayName = "Button";

// src/Input/Input.tsx
import * as React4 from "react";
import { jsx as jsx3 } from "react/jsx-runtime";
var Input = React4.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx3(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";

// src/theme/ThemeSync.tsx
import { hexToHsl } from "@stolink/tokens";

// src/theme/defaultTheme.ts
import { Palette } from "@stolink/tokens";
var defaultTheme = {
  light: {
    background: Palette.cloud[50],
    // #F1F0EC
    foreground: Palette.espresso[900],
    // #3D302A
    card: Palette.cloud[50],
    "card-foreground": Palette.espresso[900],
    popover: Palette.cloud[50],
    "popover-foreground": Palette.espresso[900],
    primary: Palette.mocha[500],
    // #A47764
    "primary-foreground": Palette.cloud[50],
    secondary: Palette.cloud[100],
    // #E8E6E1
    "secondary-foreground": Palette.espresso[900],
    muted: Palette.cloud[100],
    "muted-foreground": Palette.mocha[700],
    accent: Palette.cloud[100],
    "accent-foreground": Palette.espresso[900],
    destructive: Palette.status.error,
    "destructive-foreground": Palette.cloud[50],
    success: Palette.status.success,
    "success-foreground": Palette.cloud[50],
    warning: Palette.status.warning,
    "warning-foreground": Palette.cloud[50],
    border: Palette.cloud[200],
    input: Palette.cloud[200],
    ring: Palette.mocha[500],
    overlay: "rgba(0, 0, 0, 0.4)",
    radius: "0.5rem"
  },
  dark: {
    // Mapping for Dark Mode (using Mocha 900 / Cloud 900 logic)
    background: Palette.espresso[900],
    // #3D302A (Base)
    foreground: Palette.cloud[50],
    card: "#2A2420",
    // Slightly lighter than background
    "card-foreground": Palette.cloud[50],
    popover: "#2A2420",
    "popover-foreground": Palette.cloud[50],
    primary: Palette.mocha[500],
    "primary-foreground": Palette.cloud[50],
    secondary: Palette.mocha[900],
    // Darker
    "secondary-foreground": Palette.cloud[50],
    muted: "#4A3B35",
    "muted-foreground": Palette.mocha[400],
    accent: "#4A3B35",
    "accent-foreground": Palette.cloud[50],
    destructive: Palette.status.error,
    "destructive-foreground": Palette.cloud[50],
    success: Palette.status.success,
    "success-foreground": Palette.cloud[50],
    warning: Palette.status.warning,
    "warning-foreground": Palette.cloud[50],
    border: Palette.mocha[700],
    input: Palette.mocha[700],
    ring: Palette.mocha[500],
    overlay: "rgba(0, 0, 0, 0.7)",
    radius: "0.5rem"
  }
};

// src/theme/ThemeSync.tsx
import { jsx as jsx4 } from "react/jsx-runtime";
function cssVarsToString(variables) {
  return Object.entries(variables).map(([key, value]) => {
    let finalValue = value;
    if (value.startsWith("#")) {
      finalValue = hexToHsl(value);
    }
    return `--${key}: ${finalValue};`;
  }).join("\n");
}
var ThemeSync = () => {
  const lightVars = cssVarsToString(defaultTheme.light);
  const darkVars = cssVarsToString(defaultTheme.dark);
  return /* @__PURE__ */ jsx4(
    "style",
    {
      dangerouslySetInnerHTML: {
        __html: `
        :root {
          ${lightVars}
        }
        .dark {
          ${darkVars}
        }
      `
      }
    }
  );
};

// src/Dialog/Dialog.tsx
import * as React5 from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { jsx as jsx5, jsxs as jsxs2 } from "react/jsx-runtime";
var Dialog = DialogPrimitive.Root;
var DialogTrigger = DialogPrimitive.Trigger;
var DialogPortal = DialogPrimitive.Portal;
var DialogClose = DialogPrimitive.Close;
var DialogOverlay = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-[100] bg-overlay data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
var DialogContent = React5.forwardRef(({ className, overlayClassName, children, ...props }, ref) => /* @__PURE__ */ jsxs2(DialogPortal, { children: [
  /* @__PURE__ */ jsx5(DialogOverlay, { className: overlayClassName }),
  /* @__PURE__ */ jsxs2(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs2(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx5(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx5("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
var DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx5(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
var DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx5(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
var DialogTitle = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
  DialogPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
var DialogDescription = React5.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx5(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

// src/Card/Card.tsx
import * as React6 from "react";
import { jsx as jsx6 } from "react/jsx-runtime";
var Card = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  "div",
  {
    ref,
    className: cn(
      "rounded-xl border border-border bg-card text-card-foreground shadow-paper hover:shadow-paper-hover transition-shadow duration-300 ease-organic",
      className
    ),
    ...props
  }
));
Card.displayName = "Card";
var CardHeader = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  "div",
  {
    ref,
    className: cn("flex flex-col space-y-1.5 p-6", className),
    ...props
  }
));
CardHeader.displayName = "CardHeader";
var CardTitle = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  "div",
  {
    ref,
    className: cn("font-semibold leading-none tracking-tight", className),
    ...props
  }
));
CardTitle.displayName = "CardTitle";
var CardDescription = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  "div",
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
CardDescription.displayName = "CardDescription";
var CardContent = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6("div", { ref, className: cn("p-6 pt-0", className), ...props }));
CardContent.displayName = "CardContent";
var CardFooter = React6.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx6(
  "div",
  {
    ref,
    className: cn("flex items-center p-6 pt-0", className),
    ...props
  }
));
CardFooter.displayName = "CardFooter";

// src/Badge/Badge.tsx
import { cva as cva2 } from "class-variance-authority";
import { jsx as jsx7 } from "react/jsx-runtime";
var badgeVariants = cva2(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 truncate max-w-[200px]",
  {
    variants: {
      intent: {
        primary: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground border-border",
        success: "border-transparent bg-success text-success-foreground",
        warning: "border-transparent bg-warning text-warning-foreground"
      }
    },
    defaultVariants: {
      intent: "primary"
    }
  }
);
function Badge({ className, intent, ...props }) {
  return /* @__PURE__ */ jsx7("div", { className: cn(badgeVariants({ intent }), className), ...props });
}

// src/AlertDialog/AlertDialog.tsx
import * as React7 from "react";
import { jsx as jsx8 } from "react/jsx-runtime";
var AlertDialog = Dialog;
var AlertDialogTrigger = DialogTrigger;
var AlertDialogPortal = DialogPortal;
var AlertDialogOverlay = DialogOverlay;
var AlertDialogContent = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx8(
  DialogContent,
  {
    ref,
    className: cn(
      "max-w-[400px]",
      // Slightly narrower than default Dialog
      className
    ),
    ...props
  }
));
AlertDialogContent.displayName = "AlertDialogContent";
var AlertDialogHeader = DialogHeader;
var AlertDialogFooter = DialogFooter;
var AlertDialogTitle = DialogTitle;
var AlertDialogDescription = DialogDescription;
var AlertDialogAction = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx8("button", { ref, className: cn(buttonVariants(), className), ...props }));
AlertDialogAction.displayName = "AlertDialogAction";
var AlertDialogCancel = React7.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx8(
  "button",
  {
    ref,
    className: cn(
      buttonVariants({ intent: "outline" }),
      "mt-2 sm:mt-0",
      className
    ),
    ...props
  }
));
AlertDialogCancel.displayName = "AlertDialogCancel";
export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  Input,
  ThemeSync,
  badgeVariants,
  buttonVariants,
  cn,
  cva
};
