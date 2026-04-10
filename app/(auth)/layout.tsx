type AuthLayoutProps = {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container-sm flex min-h-screen items-center justify-center py-10">{children}</main>
    </div>
  )
}
