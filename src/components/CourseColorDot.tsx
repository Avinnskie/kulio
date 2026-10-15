import type { Course } from "@/domain"

export function CourseColorDot({ color, className = "size-2.5" }: { readonly color: Course["color"]; readonly className?: string }) {
  return <svg aria-hidden="true" className={`shrink-0 ${className}`} focusable="false" viewBox="0 0 10 10"><circle cx="5" cy="5" fill={color} r="5" /></svg>
}
