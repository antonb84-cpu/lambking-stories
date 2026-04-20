/**
 * Basic-auth is handled by the browser: when /admin is first loaded the
 * browser prompts for credentials and caches them for subsequent same-origin
 * fetches. This composable exposes a trivial logout helper that navigates
 * to a URL with explicit empty credentials, which most browsers treat as
 * "forget the cached basic-auth".
 */
export function useAuth() {
  const logout = () => {
    const url = new URL(window.location.href)
    url.username = 'logout'
    url.password = 'logout'
    window.location.assign(url.toString())
    setTimeout(() => window.location.assign('/admin'), 50)
  }
  return { logout }
}
