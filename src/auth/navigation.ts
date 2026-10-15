export function authDestination() {
  const current = new URL(window.location.href)
  const requested = current.searchParams.get("next")
  if (requested === "/" || requested?.startsWith("/?")) {
    const target = new URL(requested, current.origin)
    if (target.origin === current.origin && target.pathname === "/") return `${target.pathname}${target.search}`
  }
  const invite = current.searchParams.get("invite")
  return invite ? `/?${new URLSearchParams({ invite })}` : "/"
}
