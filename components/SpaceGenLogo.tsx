import Link from "next/link"

export default function SpaceGenLogo() {
  return (
    <Link href="/" className="flex items-center">
      <div className="w-8 h-8 bg-gradient-to-r from-[#FF6B00] to-[#9747ff] rounded mr-2"></div>
      <span className="font-bold text-lg text-white">Space Gen</span>
    </Link>
  )
} 