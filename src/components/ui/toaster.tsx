
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
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast 
            key={id} 
            {...props}
            className="glass-card border-white/20 shadow-2xl backdrop-blur-xl bg-white/80 text-slate-800"
          >
            <div className="grid gap-1">
              {title && <ToastTitle className="font-semibold text-slate-900">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-slate-700">{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className="text-slate-500 hover:text-slate-700" />
          </Toast>
        )
      })}
      <ToastViewport className="fixed top-4 right-4 z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[420px]" />
    </ToastProvider>
  )
}
