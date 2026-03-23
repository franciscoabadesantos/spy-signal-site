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