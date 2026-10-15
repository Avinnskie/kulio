import { Desktop, Moon, Sun, X } from "@phosphor-icons/react"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { ThemeChoice } from "../domain"
import { IconButton } from "./Button"

type SettingsDialogProps = {
  readonly open: boolean
  readonly theme: ThemeChoice
  readonly onChange: (theme: ThemeChoice) => void
  readonly onClose: () => void
}

const themes = [
  { value: "system", label: "Ikuti sistem", icon: <Desktop /> },
  { value: "light", label: "Terang", icon: <Sun /> },
  { value: "dark", label: "Gelap", icon: <Moon /> },
] as const

export function SettingsDialog({ open, theme, onChange, onClose }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!value) onClose() }}>
      <DialogContent className="block max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-lg overflow-y-auto rounded-md border-border bg-popover p-0 shadow-dialog dark:rounded-lg" showCloseButton={false}>
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-divider p-6">
          <span>
            <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground dark:text-primary">Preferensi</span>
            <DialogTitle className="text-2xl">Pengaturan tampilan</DialogTitle>
          </span>
          <IconButton icon={<X />} label="Tutup pengaturan" onClick={onClose} />
        </header>
        <DialogDescription className="sr-only">Pilih tema warna yang nyaman untuk Anda.</DialogDescription>
        <RadioGroup className="grid gap-2 border-0 p-6" value={theme} aria-label="Tema warna"
          onValueChange={(value) => {
            const selected = themes.find((item) => item.value === value)
            if (selected) onChange(selected.value)
          }}>
          {themes.map((item) => (
            <Label className="grid min-h-16 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-md bg-card p-3 ring-1 ring-border data-[active=true]:bg-accent [&>svg]:size-6 [&>svg]:text-foreground" data-active={theme === item.value} key={item.value} htmlFor={`theme-${item.value}`}>
              {item.icon}
              <span className="grid">
                <strong>{item.label}</strong>
                <small className="text-muted-foreground">{item.value === "system" ? "Menyesuaikan perangkat Anda" : `Selalu gunakan tema ${item.label.toLowerCase()}`}</small>
              </span>
              <RadioGroupItem id={`theme-${item.value}`} value={item.value} />
            </Label>
          ))}
        </RadioGroup>
      </DialogContent>
    </Dialog>
  )
}
