import Link from "next/link"

export default function SpaceGenLogo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-primary" />
      <span className="text-xl font-bold">Space Gen</span>
    </Link>
  )
} 