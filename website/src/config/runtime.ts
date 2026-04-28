const truthy = (v: string | undefined): boolean =>
  v === 'true' || v === '1' || v === 'yes'

// Default to the live lbs-be host. The deployed origin must be on the
// server's CORS_ORIGIN allow-list (already true for localhost:2099 and
// senfkorn.surge.sh). Set VITE_API_BASE_URL='' to fall through the Vite
// dev proxy (`/api` → lbs-be) when CORS isn't available.
export const runtime = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://lbs-be.onrender.com',
  newsletterEnabled: truthy(import.meta.env.VITE_NEWSLETTER_ENABLED)
}
