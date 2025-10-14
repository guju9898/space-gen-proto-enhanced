'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
export default function SignupPage(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const router = useRouter()
  async function onSubmit(e){
    e.preventDefault()
    // Placeholder: if you have Supabase auth hooked up, replace this with your actual sign-up call.
    // For now, simulate success:
    router.push('/studio') // or '/onboarding'
  }
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <form onSubmit={onSubmit} className="w-full max-w-md p-6 bg-[#0f1115] rounded-md">
        <h1 className="text-xl font-bold mb-4 text-white">Sign up</h1>
        <label className="block mb-2 text-sm text-muted-foreground">Email</label>
        <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full mb-3 p-2 rounded" />
        <label className="block mb-2 text-sm text-muted-foreground">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full mb-4 p-2 rounded"/>
        <button type="submit" className="bg-gradient-to-r from-[#9747ff] to-[#8608fd] text-white px-4 py-2 rounded">Create account</button>
        <p className="mt-4 text-sm"><a href="/auth/login" className="text-primary">Already have an account?</a></p>
      </form>
    </main>
  )
}
