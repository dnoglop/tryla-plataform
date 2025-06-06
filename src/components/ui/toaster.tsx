// src/components/ui/toaster.tsx

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    // <<< A CORREÇÃO ESTÁ AQUI >>>
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, duration, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            // A duração é passada para o componente Toast individualmente
            duration={duration || 5000} // Padrão de 5 segundos
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}