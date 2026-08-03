import StockTabsAuto from '@/components/stocks/StockTabsAuto'
import { getStockTickerChromeData } from '@/lib/stock-ticker-chrome'
import styles from './StockTickerLayout.module.css'

type StockTickerLayoutProps = {
  children: React.ReactNode
  params: Promise<{ ticker: string }>
}

export default function StockTickerLayout({ children, params }: StockTickerLayoutProps) {
  const chromeData = params.then(({ ticker }) => getStockTickerChromeData(ticker))

  return (
    <div className={styles.page} data-stock-ticker-layout="">
      <StockTabsAuto chromeData={chromeData} />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
