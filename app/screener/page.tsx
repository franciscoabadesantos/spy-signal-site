import Nav from '@/components/Nav'
import { Filter, Lock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default function ScreenerPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Nav active="screener" />

      <main className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Filter className="w-8 h-8 text-primary" />
              Signal Screener
            </h1>
            <p className="text-muted-foreground mt-2">Filter and discover proprietary signals across the entire database.</p>
          </div>
          
          <button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-4 py-2 rounded-md shadow-md text-sm transition-colors flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Unlock Pro Screener
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-lg flex flex-col md:flex-row min-h-[500px]">
          
          {/* Sidebar Filters (Mock) */}
          <div className="w-full md:w-64 border-r border-border p-6 bg-muted/20">
            <h2 className="text-sm font-semibold uppercase tracking-wider mb-6 text-muted-foreground">Filters</h2>
            
            <div className="space-y-6 opacity-60 pointer-events-none">
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Current Signal</label>
                <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                  <option>Bullish (Buy)</option>
                  <option>Neutral (Hold)</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Minimum Conviction</label>
                <input type="range" className="w-full" min="50" max="100" defaultValue="75" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block text-foreground">Market Cap</label>
                <select className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm">
                  <option>Mega ($200B+)</option>
                  <option>Large ($10B+)</option>
                  <option>Mid ($2B+)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-8 bg-primary/10 border border-primary/20 rounded-lg p-4 text-center">
              <Lock className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-xs font-medium text-primary">Requires Premium</div>
            </div>
          </div>

          {/* Table Results (Mock) */}
          <div className="flex-1 p-6 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <span className="text-sm text-muted-foreground">Showing 4 of 500+ available tickers</span>
            </div>
            
             <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-md">Ticker</th>
                  <th className="px-4 py-3 font-medium">Signal</th>
                  <th className="px-4 py-3 font-medium">Conviction</th>
                  <th className="px-4 py-3 font-medium rounded-tr-md">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold">
                       <Link href="/stocks/AAPL" className="text-primary hover:underline">AAPL</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded text-xs font-semibold">BUY</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">84%</td>
                    <td className="px-4 py-3 font-medium">$172.45</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold">
                       <Link href="/stocks/MSFT" className="text-primary hover:underline">MSFT</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded text-xs font-semibold">BUY</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">79%</td>
                    <td className="px-4 py-3 font-medium">$420.55</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold">
                       <Link href="/stocks/TSLA" className="text-primary hover:underline">TSLA</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-slate-500/10 text-slate-300 border border-slate-500/20 px-2 py-0.5 rounded text-xs font-semibold">HOLD</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">51%</td>
                    <td className="px-4 py-3 font-medium">$175.22</td>
                  </tr>
                  <tr className="hover:bg-muted/10">
                    <td className="px-4 py-3 font-bold">
                       <Link href="/stocks/NVDA" className="text-primary hover:underline">NVDA</Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 px-2 py-0.5 rounded text-xs font-semibold">BUY</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">92%</td>
                    <td className="px-4 py-3 font-medium">$890.10</td>
                  </tr>
              </tbody>
            </table>
            
            <div className="absolute inset-0 top-64 bg-gradient-to-t from-background via-background/90 to-transparent flex items-end justify-center pb-12">
               <div className="bg-card border border-border p-5 rounded-xl shadow-2xl text-center max-w-sm">
                 <Lock className="w-8 h-8 text-primary mx-auto mb-3" />
                 <h4 className="font-semibold text-foreground mb-1">See All Tickers</h4>
                 <p className="text-xs text-muted-foreground mb-4">You are viewing 4 sample results. Upgrade to unlock the entire signal database.</p>
                 <button className="w-full text-sm font-medium bg-primary text-primary-foreground py-2 rounded">Upgrade Now</button>
               </div>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}
