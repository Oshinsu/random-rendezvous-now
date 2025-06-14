
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-heading font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-95 hover:scale-105",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-medium hover:shadow-glow hover:from-brand-600 hover:to-brand-700 transform",
        destructive: "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-medium hover:shadow-strong hover:from-red-600 hover:to-red-700 transform",
        outline: "border-2 border-neutral-200 bg-white/80 backdrop-blur-sm text-neutral-700 hover:bg-white hover:border-brand-300 hover:text-brand-700 shadow-soft hover:shadow-medium transform",
        secondary: "bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-900 hover:bg-gradient-to-r hover:from-neutral-200 hover:to-neutral-300 shadow-soft hover:shadow-medium transform",
        ghost: "text-neutral-700 hover:bg-brand-50 hover:text-brand-700 transform",
        link: "text-brand-600 underline-offset-4 hover:underline hover:text-brand-700 font-medium",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-3xl px-8 text-base",
        icon: "h-11 w-11 rounded-2xl",
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
