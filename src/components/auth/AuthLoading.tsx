import Image from "next/image"

export function AuthLoading() {
  return <div className="grid min-h-svh content-center justify-items-center gap-3 text-muted-foreground" role="status"><span className="grid size-14 place-items-center overflow-hidden rounded-lg bg-accent"><Image src="/favicon.png" alt="" width={56} height={56} className="size-14 object-contain" /></span><strong className="text-foreground">Menyiapkan Kulio...</strong><span>Memuat akun dan ruang belajar Anda.</span></div>
}
