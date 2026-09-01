import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/* ── Variant maps ── */

const variantStyles: Record<string, string> = {
  default:
    "bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25",
  outline:
    "border border-line bg-transparent text-slate-200 hover:bg-panel2 hover:border-accent/50",
  ghost: "text-slate-400 hover:text-slate-200 hover:bg-panel2",
  destructive:
    "bg-error/90 hover:bg-error text-white shadow-lg shadow-error/20",
  success:
    "bg-ok/90 hover:bg-ok text-slate-900 shadow-lg shadow-ok/20",
};

const sizeStyles: Record<string, string> = {
  sm: "h-8 px-3 text-xs rounded-md",
  md: "h-10 px-5 text-sm rounded-lg",
  lg: "h-11 px-6 text-sm rounded-lg",
  icon: "h-9 w-9 rounded-lg",
};

/* ── Props ── */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
  asChild?: boolean;
}

/* ── Component ── */

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "md",
      loading = false,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
      variantStyles[variant],
      sizeStyles[size],
      className
    );

    // Si asChild es verdadero, se usa Slot garantizando un único envoltorio de hijo (span)
    // para evitar que Radix colapse por múltiples elementos.
    if (asChild) {
      return (
        <Slot ref={ref} className={baseClasses} {...props}>
          <span>
            {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
            {children}
          </span>
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={baseClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };