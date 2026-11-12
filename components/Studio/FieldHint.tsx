export function FieldHint({ children }: { children?: string }) {
  if (!children) return null
  return <p className="-mt-0.5 mb-1.5 text-xs leading-snug text-muted-foreground">{children}</p>
}
