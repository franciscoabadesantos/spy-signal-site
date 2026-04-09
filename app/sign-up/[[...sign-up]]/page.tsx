import { SignUp } from '@clerk/nextjs'
import AuthShell from '@/components/shells/AuthShell'

export default function SignUpPage() {
  return (
    <AuthShell>
      <SignUp path="/sign-up" routing="path" signInUrl="/sign-in" forceRedirectUrl="/dashboard" />
    </AuthShell>
  )
}
