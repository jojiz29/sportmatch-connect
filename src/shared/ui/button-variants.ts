import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-primary to-[#FF8E53] text-primary-foreground shadow-[0_4px_14px_rgba(255,107,53,0.35)] border border-primary/20 hover:shadow-[0_6px_20px_rgba(255,107,53,0.5)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_4px_14px_rgba(255,59,48,0.3)] border border-destructive/20 hover:bg-destructive/90 hover:shadow-[0_6px_20px_rgba(255,59,48,0.5)]",
        outline:
          "border border-white/10 bg-white/5 backdrop-blur-md text-foreground shadow-sm hover:bg-white/10 hover:border-white/20",
        secondary:
          "bg-gradient-to-r from-secondary to-[#00FF7F] text-secondary-foreground shadow-[0_4px_14px_rgba(57,255,20,0.25)] border border-secondary/20 hover:shadow-[0_6px_20px_rgba(57,255,20,0.45)]",
        ghost: "hover:bg-white/5 hover:text-foreground backdrop-blur-[2px]",
        link: "text-primary underline-offset-4 hover:underline hover:-translate-y-0 active:scale-100",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);
