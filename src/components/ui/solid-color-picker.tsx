"use client"

import { CaretDown, Plus, X } from "@phosphor-icons/react"
import { useState } from "react"
import {
  ColorArea,
  ColorField,
  ColorPicker,
  ColorSlider,
  ColorSwatch,
  ColorSwatchPicker,
  ColorSwatchPickerItem,
  ColorThumb,
  Input as ColorInput,
  SliderTrack,
  type Color,
} from "react-aria-components"
import { CourseColorDot } from "@/components/CourseColorDot"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CourseColorSchema, DEFAULT_COURSE_COLOR, type Course } from "@/domain"

const SAVED_COLORS_KEY = "kulio.course-colors.v1"
const MAX_SAVED_COLORS = 18
const DEFAULT_SAVED_COLORS = [
  DEFAULT_COURSE_COLOR,
  "#477FB9",
  "#4F46E5",
  "#7F56D9",
  "#C026D3",
  "#D92D20",
  "#EA580C",
] as const

type SolidColorPickerProps = {
  readonly id: string
  readonly name: string
  readonly value: string
  readonly disabled?: boolean
  readonly onChange: (value: Course["color"]) => void
}

function normalizeColor(value: unknown): Course["color"] {
  const parsed = CourseColorSchema.safeParse(value)
  return parsed.success ? parsed.data : DEFAULT_COURSE_COLOR
}

function mergeSavedColors(values: readonly unknown[]): Course["color"][] {
  const colors = new Set<Course["color"]>(DEFAULT_SAVED_COLORS)
  for (const value of values) {
    const parsed = CourseColorSchema.safeParse(value)
    if (parsed.success) colors.add(parsed.data)
  }
  return Array.from(colors).slice(0, MAX_SAVED_COLORS)
}

function loadSavedColors(): Course["color"][] {
  if (typeof window === "undefined") return mergeSavedColors([])

  try {
    const stored = window.localStorage.getItem(SAVED_COLORS_KEY)
    if (stored === null) return mergeSavedColors([])
    const parsed: unknown = JSON.parse(stored)
    return Array.isArray(parsed) ? mergeSavedColors(parsed) : mergeSavedColors([])
  } catch (error: unknown) {
    if (error instanceof DOMException || error instanceof SyntaxError) return mergeSavedColors([])
    throw error
  }
}

function storeSavedColors(colors: readonly Course["color"][]): void {
  try {
    window.localStorage.setItem(SAVED_COLORS_KEY, JSON.stringify(colors))
  } catch (error: unknown) {
    if (!(error instanceof DOMException)) throw error
  }
}

export function SolidColorPicker({ id, name, value, disabled = false, onChange }: SolidColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [savedColors, setSavedColors] = useState<Course["color"][]>(loadSavedColors)
  const color = normalizeColor(value)
  const isSaved = savedColors.includes(color)

  const updateColor = (nextColor: Color) => {
    const parsed = CourseColorSchema.safeParse(nextColor.toString("hex"))
    if (parsed.success) onChange(parsed.data)
  }

  const addSavedColor = () => {
    if (isSaved) return
    const nextColors = mergeSavedColors([color, ...savedColors])
    setSavedColors(nextColors)
    storeSavedColors(nextColors)
  }

  return (
    <ColorPicker value={color} onChange={updateColor}>
      <input name={name} type="hidden" value={color} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={`Pilih warna mata kuliah. Warna saat ini ${color}`}
            className="h-11 w-full justify-between bg-background px-3 font-normal shadow-xs"
          >
            <span className="flex min-w-0 items-center gap-3">
              <CourseColorDot color={color} className="size-5 shrink-0" />
              <span className="truncate font-mono text-sm uppercase">{color}</span>
            </span>
            <CaretDown className="text-muted-foreground" aria-hidden="true" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          sideOffset={8}
          className="max-h-[calc(100dvh-2rem)] w-[min(22rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto rounded-xl p-0 shadow-dialog"
        >
          <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-divider bg-popover px-4">
            <span className="flex h-full items-center border-b-2 border-primary px-1 font-bold text-primary">Solid</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Tutup pemilih warna"
              onClick={() => setOpen(false)}
            >
              <X />
            </Button>
          </div>

          <div className="grid gap-5 p-4">
            <ColorArea
              aria-label="Saturasi dan kecerahan warna"
              colorSpace="hsb"
              xChannel="saturation"
              yChannel="brightness"
              isDisabled={disabled}
              className="relative aspect-square w-full rounded-lg shadow-inner outline-none"
            >
              <ColorThumb className="size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-md outline-none transition-transform data-[dragging]:scale-110 data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/60 motion-reduce:transition-none" />
            </ColorArea>

            <ColorSlider
              aria-label="Hue warna"
              channel="hue"
              colorSpace="hsb"
              isDisabled={disabled}
              className="w-full outline-none"
            >
              <SliderTrack className="relative my-2 h-3 w-full rounded-full shadow-inner">
                <ColorThumb className="top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white shadow-md outline-none transition-transform data-[dragging]:scale-110 data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/60 motion-reduce:transition-none" />
              </SliderTrack>
            </ColorSlider>

            <div className="grid grid-cols-[4.75rem_minmax(0,1fr)] gap-3">
              <div className="grid h-11 place-items-center rounded-md border border-border bg-muted/40 text-sm font-semibold text-muted-foreground">
                HEX
              </div>
              <ColorField aria-label="Kode warna HEX" isDisabled={disabled} className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center">
                  <CourseColorDot color={color} className="size-5" />
                </span>
                <ColorInput className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 font-mono text-sm uppercase shadow-xs outline-none transition-shadow focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50" />
              </ColorField>
            </div>

            <section className="grid gap-3" aria-labelledby={`${id}-saved-colors`}>
              <div className="flex items-center justify-between gap-3">
                <h4 id={`${id}-saved-colors`} className="text-sm font-bold">Tersimpan</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={disabled || isSaved}
                  onClick={addSavedColor}
                >
                  <Plus />
                  {isSaved ? "Tersimpan" : "Tambah"}
                </Button>
              </div>
              <ColorSwatchPicker aria-label="Warna tersimpan" className="flex flex-wrap gap-2">
                {savedColors.map((savedColor) => (
                  <ColorSwatchPickerItem
                    key={savedColor}
                    color={savedColor}
                    isDisabled={disabled}
                    className={({ isFocusVisible, isSelected }) => [
                      "grid size-10 cursor-pointer place-items-center rounded-full outline-none transition-transform motion-reduce:transition-none",
                      isSelected ? "ring-2 ring-primary ring-offset-2 ring-offset-popover" : "hover:scale-105",
                      isFocusVisible ? "ring-[3px] ring-ring/60 ring-offset-2 ring-offset-popover" : "",
                    ].join(" ")}
                  >
                    <ColorSwatch className="size-8 rounded-full border border-black/10 shadow-sm" />
                  </ColorSwatchPickerItem>
                ))}
              </ColorSwatchPicker>
            </section>
          </div>
        </PopoverContent>
      </Popover>
    </ColorPicker>
  )
}
