import SiteChromeMotion from '@/components/marketing/SiteChromeMotion'

type MarketingLayoutProps = {
  children: React.ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <>
      <SiteChromeMotion />
      {children}
    </>
  )
}
