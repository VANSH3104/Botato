import { SignIn } from "@clerk/nextjs"
import { BotatoLogo } from "@/components/logo"

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-6">
      <BotatoLogo iconClassName="size-8" className="text-xl" />
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
