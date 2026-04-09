import Nav from '@/components/Nav'
import StockHeader from '@/components/page/StockHeader'
import StockTabs, { type StockTabKey } from '@/components/page/StockTabs'

type ResearchShellProps = {
  ticker: string
  activeTab: StockTabKey
  header: React.ComponentProps<typeof StockHeader>
  children: React.ReactNode
  breadcrumbs?: React.ReactNode
  controls?: React.ReactNode
}

export default function ResearchShell({
  ticker,
  activeTab,
  header,
  children,
  breadcrumbs,
  controls,
}: ResearchShellProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav active="stocks" />
      <main className="container-lg py-6 pb-20 section-gap">
        {breadcrumbs}
        <StockHeader {...header} />
        <StockTabs ticker={ticker} active={activeTab} />
        {controls ? <div>{controls}</div> : null}
        <div>{children}</div>
      </main>
    </div>
  )
}
