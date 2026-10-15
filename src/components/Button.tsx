import type { ButtonHTMLAttributes, ReactNode } from "react"
import { Button as ShadcnButton } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ButtonProps = {
  readonly variant?: "primary" | "secondary" | "ghost" | "danger"
  readonly icon?: ReactNode
  readonly children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function Button({
  variant = "secondary",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const variants = { primary: "default", secondary: "outline", ghost: "ghost", danger: "destructive" } as const
  return (
    <ShadcnButton className={`min-h-11 gap-2 active:scale-[0.96] motion-reduce:transform-none ${className}`} variant={variants[variant]} type="button" {...props}>
      {icon === undefined ? null : <span className="[&_svg]:size-[1.125rem]">{icon}</span>}
      <span>{children}</span>
    </ShadcnButton>
  )
}

type IconButtonProps = {
  readonly label: string
  readonly icon: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>

export function IconButton({ label, icon, className = "", ...props }: IconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <ShadcnButton aria-label={label} className={`size-11 shrink-0 text-muted-foreground active:scale-95 motion-reduce:transform-none [&_svg]:size-5 ${className}`} size="icon" variant="ghost" type="button" {...props}>
          {icon}
        </ShadcnButton>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
