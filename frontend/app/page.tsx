"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import Logo from "@/components/Logo"

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <Logo className="h-24 w-24 mb-6" />
        <h1 className="text-6xl font-bold">
          Welcome to <span className="text-blue-600">Trade Lens</span>
        </h1>

        <p className="mt-3 text-2xl">
          Get started by signing in with your Google account.
        </p>

        <div className="mt-8">
          <Button onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
            Sign in with Google
          </Button>
        </div>
      </main>
    </div>
  )
}
