import type { GuidebookEntry } from './guidebook'
import type { SafetyAlert } from './safety'
import type { HostelEvent } from './events'

/** GET /api/v1/public/bootstrap - one round trip for a cold guest load. */
export interface PublicBootstrap {
  guidebook: GuidebookEntry[]
  safety_alerts: SafetyAlert[]
  events: HostelEvent[]
}
