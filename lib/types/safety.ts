import type { Timestamp } from './api'

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SafetyAlert {
  alert_id: number
  created_by: number | null
  title: string | null
  body: string | null
  severity: AlertSeverity | null
  is_active: boolean
  created_at: Timestamp
}
