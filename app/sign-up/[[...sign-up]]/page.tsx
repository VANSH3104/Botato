import { SignUp } from "@clerk/nextjs"

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
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
