// components/ui/progress.tsx

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  // 1. O container da barra (o "fundo")
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2.5 w-full overflow-hidden rounded-full bg-[--progress-background]", // Usa a variável de fundo
      className
    )}
    {...props}
  >
    {/* 2. O indicador de progresso (a "barra preenchida") */}
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-[--progress-foreground] transition-all duration-500 ease-out" // Usa a variável de preenchimento
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }