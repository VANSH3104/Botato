import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn
        appearance={{
          elements: {
            footer: "!hidden hidden",
            footerAction: "!hidden hidden",
          },
        }}
      />
    </div>
  )
}
