/**
 * Two-screen path router for the admin SPA.
 *
 * The admin app has exactly two screens (book management and the usage
 * dashboard), so it doesn't carry vue-router — this reads the screen off
 * `location.pathname` and pushes history entries for in-app navigation.
 * The server serves index.html for every `/admin/*` path behind basic auth
 * (see server/src/routes/admin.routes.ts), so a direct hit on
 * `/admin/usage` or a browser reload lands on the right screen.
 */
import { readonly, ref } from 'vue'

export type AdminRoute = 'books' | 'usage'

const BASE = '/admin'

function routeFromPath(pathname: string): AdminRoute {
  return pathname.replace(/\/+$/, '').endsWith('/usage') ? 'usage' : 'books'
}

function pathFor(route: AdminRoute): string {
  return route === 'usage' ? `${BASE}/usage` : `${BASE}/`
}

const current = ref<AdminRoute>(routeFromPath(window.location.pathname))

// Back/forward has to move the view too, otherwise the URL and the screen
// drift apart.
window.addEventListener('popstate', () => {
  current.value = routeFromPath(window.location.pathname)
})

export function useAdminRoute() {
  function navigate(route: AdminRoute) {
    if (current.value === route) return
    window.history.pushState({ route }, '', pathFor(route))
    current.value = route
  }

  return { route: readonly(current), navigate }
}
