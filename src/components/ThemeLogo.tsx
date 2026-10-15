import Image from "next/image"
import { cn } from "@/lib/utils"

type ThemeLogoProps = {
  readonly className?: string
  readonly priority?: boolean
}

export function ThemeLogo({ className, priority = false }: ThemeLogoProps) {
  const imageClassName = cn("w-auto object-contain object-left", className)

  return (
    <>
      <Image
        src="/logo-dark.png"
        alt="Kulio"
        width={205}
        height={77}
        priority={priority}
        className={cn(imageClassName, "dark:hidden")}
      />
      <Image
        src="/logo-white.png"
        alt="Kulio"
        width={208}
        height={77}
        priority={priority}
        className={cn(imageClassName, "hidden dark:block")}
      />
    </>
  )
}
