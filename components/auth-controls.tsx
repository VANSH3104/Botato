"use client"

import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"

export function AuthControls() {
  return (
    <Show when="signed-out" fallback={<UserButton />}>
      <SignInButton />
      <SignUpButton />
    </Show>
  )
}