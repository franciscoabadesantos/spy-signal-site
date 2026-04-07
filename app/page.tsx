import Nav from '@/components/Nav'
import { getLatestSignal } from '@/lib/signals'
import { ArrowRight, BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const signal = await getLatestSignal()
  
  const currentStance = signal
    ? (signal.direction === 'bullish' ? 'bullish' : 'neutral')
    : null
    
  return (
    <div className="min-h-screen bg-[#f9fafb] text-[#111827]">
      <Nav />
      
      {/* Top Banner */}
      <div className="bg-white border-b border-gray-200 py-8">
         <div className="max-w-[1240px] mx-auto px-4 md:px-6">
           <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Systems Overview</h1>
           <p className="text-gray-600 text-[15px]">Monitor live quantitative models across actively covered assets.</p>
         </div>
      </div>

      <main className="max-w-[1240px] mx-auto px-4 md:px-6 py-10">
        
        {/* Active Models Table */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-8">
           <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
             <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
               <BarChart3 className="w-5 h-5 text-primary" />
               Live Tracked Assets
             </h2>
             <span className="text-sm font-medium text-gray-500 flex items-center gap-1.5">
               <Clock className="w-4 h-4" /> Updated Daily
             </span>
           </div>
           
           <div className="overflow-x-auto">
             <table className="w-full text-left text-sm whitespace-nowrap">
               <thead className="bg-gray-50 text-gray-500 font-medium">
                 <tr>
                   <th className="px-6 py-3.5 border-b border-gray-200">Asset</th>
                   <th className="px-6 py-3.5 border-b border-gray-200">System State</th>
                   <th className="px-6 py-3.5 border-b border-gray-200">Win Rate</th>
                   <th className="px-6 py-3.5 border-b border-gray-200">YTD Return</th>
                   <th className="px-6 py-3.5 border-b border-gray-200 text-right">Action</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                 {/* SPY Row (Live) */}
                 <tr className="hover:bg-gray-50/80 transition-colors">
                   <td className="px-6 py-4">
                     <Link href="/stocks/SPY" className="flex items-center gap-3 w-max">
                       <div className="font-bold text-primary hover:underline tabular-nums">SPY</div>
                       <div className="text-gray-500 font-medium text-[13px] hidden sm:block">SPDR S&P 500 ETF Trust</div>
                     </Link>
                   </td>
                   <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5">
                       {currentStance === 'bullish' ? (
                         <>
                           <TrendingUp className="w-4 h-4 text-green-600" />
                           <span className="text-green-700 font-bold bg-green-50 border border-green-200/60 px-2 py-0.5 rounded text-[13px]">BULLISH</span>
                         </>
                       ) : (
                         <>
                           <TrendingDown className="w-4 h-4 text-gray-500" />
                           <span className="text-gray-700 font-bold bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[13px]">NEUTRAL</span>
                         </>
                       )}
                     </div>
                   </td>
                   <td className="px-6 py-4 font-semibold text-gray-700">62.4%</td>
                   <td className="px-6 py-4 font-semibold text-green-600">+14.2%</td>
                   <td className="px-6 py-4 text-right">
                     <Link href="/stocks/SPY" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary/80">
                       View Dashboard <ArrowRight className="w-4 h-4" />
                     </Link>
                   </td>
                 </tr>

                 {/* Mock Row AAPL */}
                 <tr className="hover:bg-gray-50/80 transition-colors opacity-60">
                   <td className="px-6 py-4">
                     <Link href="/stocks/AAPL" className="flex items-center gap-3 w-max">
                       <div className="font-bold text-gray-900 hover:text-primary transition-colors tabular-nums">AAPL</div>
                       <div className="text-gray-500 font-medium text-[13px] hidden sm:block">Apple Inc.</div>
                     </Link>
                   </td>
                   <td className="px-6 py-4">
                     <span className="text-gray-500 font-medium bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[13px]">PENDING</span>
                   </td>
                   <td className="px-6 py-4 font-medium text-gray-400">—</td>
                   <td className="px-6 py-4 font-medium text-gray-400">—</td>
                   <td className="px-6 py-4 text-right">
                     <Link href="/stocks/AAPL" className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-500 hover:text-gray-700">
                       View Stock
                     </Link>
                   </td>
                 </tr>

                 {/* Mock Row MSFT */}
                 <tr className="hover:bg-gray-50/80 transition-colors opacity-60">
                   <td className="px-6 py-4">
                     <Link href="/stocks/MSFT" className="flex items-center gap-3 w-max">
                       <div className="font-bold text-gray-900 hover:text-primary transition-colors tabular-nums">MSFT</div>
                       <div className="text-gray-500 font-medium text-[13px] hidden sm:block">Microsoft Corp.</div>
                     </Link>
                   </td>
                   <td className="px-6 py-4">
                     <span className="text-gray-500 font-medium bg-gray-100 border border-gray-200 px-2 py-0.5 rounded text-[13px]">PENDING</span>
                   </td>
                   <td className="px-6 py-4 font-medium text-gray-400">—</td>
                   <td className="px-6 py-4 font-medium text-gray-400">—</td>
                   <td className="px-6 py-4 text-right">
                     <Link href="/stocks/MSFT" className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-500 hover:text-gray-700">
                       View Stock
                     </Link>
                   </td>
                 </tr>
               </tbody>
             </table>
           </div>
        </div>

      </main>
    </div>
  )
}
