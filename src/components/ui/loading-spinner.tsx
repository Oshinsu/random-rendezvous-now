import { cn } from "@/lib/utils"

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg"
}

const LoadingSpinner = ({ className, size = "md", ...props }: LoadingSpinnerProps) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-muted border-t-primary",
        {
          "h-4 w-4": size === "sm",
          "h-8 w-8": size === "md", 
          "h-12 w-12": size === "lg"
        },
        className
      )}
      {...props}
    />
  )
}

export { LoadingSpinner }