import { SignIn } from '@clerk/nextjs'
import AuthShell from '@/components/shells/AuthShell'

export default function SignInPage() {
  return (
    <AuthShell>
      <SignIn path="/sign-in" routing="path" signUpUrl="/sign-up" forceRedirectUrl="/dashboard" />
    </AuthShell>
  )
}
