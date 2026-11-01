import { SignUp } from "@clerk/nextjs"
import { BotatoLogo } from "@/components/logo"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 gap-6">
      <BotatoLogo iconClassName="size-8" className="text-xl" />
      <SignUp
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
