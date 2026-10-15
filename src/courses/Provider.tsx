"use client"

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { DEFAULT_COURSE_COLOR, type Course, type CourseId } from "@/domain"

type CourseCatalog = {
  readonly courses: readonly Course[]
  readonly courseById: (courseId: CourseId) => Course
}

const CourseContext = createContext<CourseCatalog | null>(null)

export function CourseProvider({ courses, children }: { readonly courses: readonly Course[]; readonly children: ReactNode }) {
  const courseById = useCallback((courseId: CourseId): Course => courses.find((course) => course.id === courseId) ?? {
    id: courseId,
    name: "Mata kuliah tidak tersedia",
    shortName: "—",
    color: DEFAULT_COURSE_COLOR,
  }, [courses])
  const value = useMemo(() => ({ courses, courseById }), [courses, courseById])
  return <CourseContext value={value}>{children}</CourseContext>
}

export function useCourses() {
  const context = useContext(CourseContext)
  if (context === null) throw new Error("Course catalog requires a CourseProvider")
  return context
}
