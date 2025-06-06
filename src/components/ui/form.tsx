import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { Slot } from "@radix-ui/react-slot"
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form"
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
)

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const { getFieldState, formState } = useFormContext()

  const fieldState = getFieldState(fieldContext.name, formState)

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>")
  }

  const { id } = itemContext

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}

type FormItemContextValue = {
  id: string
}

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
)

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div 
        ref={ref} 
        className={cn(
          "group relative space-y-3 transition-all duration-300",
          className
        )} 
        {...props} 
      />
    </FormItemContext.Provider>
  )
})
FormItem.displayName = "FormItem"

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField()

  return (
    <Label
      ref={ref}
      className={cn(
        "text-sm font-semibold text-slate-700 transition-colors duration-200",
        "group-focus-within:text-orange-600",
        error && "text-red-500",
        className
      )}
      htmlFor={formItemId}
      {...props}
    />
  )
})
FormLabel.displayName = "FormLabel"

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  )
})
FormControl.displayName = "FormControl"

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField()

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn(
        "text-xs text-slate-500 leading-relaxed transition-all duration-200",
        "group-focus-within:text-slate-600",
        className
      )}
      {...props}
    />
  )
})
FormDescription.displayName = "FormDescription"

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField()
  const body = error ? String(error?.message) : children

  if (!body) {
    return null
  }

  return (
    <div className="flex items-center gap-2 animate-in slide-in-from-left-2 duration-300">
      <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
      <p
        ref={ref}
        id={formMessageId}
        className={cn(
          "text-xs font-medium text-red-500 leading-relaxed",
          className
        )}
        {...props}
      >
        {body}
      </p>
    </div>
  )
})
FormMessage.displayName = "FormMessage"

// Enhanced Input Component with Glassmorphism
const FormInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    variant?: "default" | "glass" | "floating"
    showPasswordToggle?: boolean
  }
>(({ className, type, variant = "default", showPasswordToggle = false, ...props }, ref) => {
  const { error, isDirty } = useFormField()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  
  const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type

  const baseClasses = cn(
    "w-full px-4 py-3 text-base transition-all duration-300 outline-none",
    "placeholder:text-slate-400 placeholder:transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
  )

  const variantClasses = {
    default: cn(
      "bg-white border-2 border-slate-200 rounded-xl",
      "focus:border-orange-400 focus:ring-4 focus:ring-orange-100",
      "hover:border-slate-300",
      error && "border-red-300 focus:border-red-400 focus:ring-red-100",
      isDirty && !error && "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
    ),
    glass: cn(
      "bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg",
      "focus:bg-white/80 focus:border-orange-300/50 focus:ring-4 focus:ring-orange-100/50",
      "hover:bg-white/75 hover:border-white/30",
      error && "border-red-300/50 focus:border-red-400/50 focus:ring-red-100/50",
      isDirty && !error && "border-emerald-300/50 focus:border-emerald-400/50 focus:ring-emerald-100/50"
    ),
    floating: cn(
      "bg-transparent border-0 border-b-2 border-slate-200 rounded-none px-0 pb-2",
      "focus:border-orange-400",
      "hover:border-slate-300",
      error && "border-red-300 focus:border-red-400",
      isDirty && !error && "border-emerald-300 focus:border-emerald-400"
    )
  }

  return (
    <div className="relative">
      <input
        type={inputType}
        className={cn(baseClasses, variantClasses[variant], className)}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {/* Success Indicator */}
      {isDirty && !error && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Check className="h-5 w-5 text-emerald-500" />
        </div>
      )}
      
      {/* Password Toggle */}
      {showPasswordToggle && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      )}
      
      {/* Focus Ring Effect */}
      {isFocused && variant === "glass" && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/10 to-orange-600/10 -z-10 blur-sm animate-pulse" />
      )}
    </div>
  )
})
FormInput.displayName = "FormInput"

// Enhanced Textarea Component
const FormTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    variant?: "default" | "glass"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const { error, isDirty } = useFormField()
  const [isFocused, setIsFocused] = React.useState(false)

  const baseClasses = cn(
    "w-full px-4 py-3 text-base transition-all duration-300 outline-none resize-none",
    "placeholder:text-slate-400 placeholder:transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "min-h-[100px]"
  )

  const variantClasses = {
    default: cn(
      "bg-white border-2 border-slate-200 rounded-xl",
      "focus:border-orange-400 focus:ring-4 focus:ring-orange-100",
      "hover:border-slate-300",
      error && "border-red-300 focus:border-red-400 focus:ring-red-100",
      isDirty && !error && "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100"
    ),
    glass: cn(
      "bg-white/70 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg",
      "focus:bg-white/80 focus:border-orange-300/50 focus:ring-4 focus:ring-orange-100/50",
      "hover:bg-white/75 hover:border-white/30",
      error && "border-red-300/50 focus:border-red-400/50 focus:ring-red-100/50",
      isDirty && !error && "border-emerald-300/50 focus:border-emerald-400/50 focus:ring-emerald-100/50"
    )
  }

  return (
    <div className="relative">
      <textarea
        className={cn(baseClasses, variantClasses[variant], className)}
        ref={ref}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      
      {/* Success Indicator */}
      {isDirty && !error && (
        <div className="absolute right-3 top-3">
          <Check className="h-5 w-5 text-emerald-500" />
        </div>
      )}
      
      {/* Focus Ring Effect */}
      {isFocused && variant === "glass" && (
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-400/10 to-orange-600/10 -z-10 blur-sm animate-pulse" />
      )}
    </div>
  )
})
FormTextarea.displayName = "FormTextarea"

// Enhanced Button Component
const FormButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "glass" | "ghost"
    size?: "sm" | "md" | "lg"
    loading?: boolean
  }
>(({ className, variant = "primary", size = "md", loading = false, children, disabled, ...props }, ref) => {
  const baseClasses = cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-300",
    "focus:outline-none focus:ring-4 disabled:cursor-not-allowed",
    "transform active:scale-95"
  )

  const sizeClasses = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl"
  }

  const variantClasses = {
    primary: cn(
      "bg-orange-500 text-white shadow-lg shadow-orange-500/30",
      "hover:bg-orange-600 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-500/40",
      "focus:ring-orange-200",
      "disabled:bg-slate-300 disabled:shadow-none disabled:translate-y-0"
    ),
    secondary: cn(
      "bg-slate-100 text-slate-700 border-2 border-slate-200",
      "hover:bg-slate-200 hover:border-slate-300 hover:-translate-y-0.5",
      "focus:ring-slate-200",
      "disabled:bg-slate-50 disabled:text-slate-400 disabled:translate-y-0"
    ),
    glass: cn(
      "bg-white/80 backdrop-blur-sm text-slate-700 border border-white/20 shadow-lg",
      "hover:bg-white/90 hover:-translate-y-0.5 hover:shadow-xl",
      "focus:ring-orange-200/50",
      "disabled:bg-white/50 disabled:shadow-none disabled:translate-y-0"
    ),
    ghost: cn(
      "bg-transparent text-slate-600 border-2 border-transparent",
      "hover:bg-slate-100 hover:border-slate-200",
      "focus:ring-slate-200",
      "disabled:text-slate-400"
    )
  }

  return (
    <button
      ref={ref}
      className={cn(baseClasses, sizeClasses[size], variantClasses[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
})
FormButton.displayName = "FormButton"

// Form Container with Glassmorphism
const FormContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: "default" | "glass" | "card"
  }
>(({ className, variant = "default", ...props }, ref) => {
  const variantClasses = {
    default: "space-y-6",
    glass: cn(
      "p-8 rounded-3xl space-y-6",
      "bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl",
      "relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/10 before:to-transparent before:pointer-events-none"
    ),
    card: cn(
      "p-6 rounded-2xl space-y-6",
      "bg-white border border-slate-200/50 shadow-sm",
      "hover:shadow-md transition-shadow duration-300"
    )
  }

  return (
    <div
      ref={ref}
      className={cn(variantClasses[variant], className)}
      {...props}
    />
  )
})
FormContainer.displayName = "FormContainer"

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  FormInput,
  FormTextarea,
  FormButton,
  FormContainer,
}