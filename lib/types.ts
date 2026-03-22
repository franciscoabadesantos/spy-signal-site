export type Signal = {
  id: number
  signal_date: string
  direction: 'bullish' | 'bearish' | 'neutral'
  position: number | null
  signal_strength: number | null
  prob_side: number | null
  prediction_horizon: number
  realized_return: number | null
  correct: boolean | null
  model_version_id: string | null
  retrain_id: string | null
  created_at: string
  updated_at: string
}