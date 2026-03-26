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
  live_episode_status: 'flat' | 'pending_entry' | 'in_trade' | 'exit_pending' | null
  live_flat_episode_status: string | null
  live_episode_return_to_date: number | null
  live_flat_episode_spy_move_to_date: number | null
  live_episode_days_in_trade?: number | null
  live_episode_entry_date: string | null
}
