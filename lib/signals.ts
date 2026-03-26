import { supabase } from './supabase'
import { Signal } from './types'

export async function getRecentSignals(limit = 20): Promise<Signal[]> {
  const { data, error } = await supabase
    .from('spy_signals_live')
    .select('*')
    .order('signal_date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching signals:', error.message, error.details)
    throw new Error(`Failed to fetch signals: ${error.message}`)
  }

  return data as Signal[]
}

export async function getLatestSignal(): Promise<Signal | null> {
  const signals = await getRecentSignals(1)
  return signals[0] ?? null
}

export async function getDataStartDate(): Promise<string | null> {
  const { data, error } = await supabase
    .from('spy_signals_live')
    .select('signal_date')
    .order('signal_date', { ascending: true })
    .limit(1)

  if (error) {
    console.error('Error fetching data start date:', error.message, error.details)
    throw new Error(`Failed to fetch data start date: ${error.message}`)
  }

  return (data?.[0] as { signal_date?: string } | undefined)?.signal_date ?? null
}
