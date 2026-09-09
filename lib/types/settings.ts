/**
 * GET /api/v1/settings/maintenance
 *
 * The key is `enabled`. app/page.tsx previously read `maintenance_mode`,
 * which meant maintenance mode never fired on the client.
 */
export interface MaintenanceStatus {
  enabled: boolean
}
