import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-border-strong disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-text-inverse hover:opacity-85 active:scale-98",
        secondary:
          "bg-transparent border border-border-medium text-text-primary hover:bg-bg-tertiary",
        ghost:
          "bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
        danger:
          "bg-accent-danger text-white hover:bg-[#DC2626]",
        icon:
          "h-10 w-10 bg-transparent hover:bg-bg-tertiary text-text-secondary",
        link: "text-text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[44px] px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
