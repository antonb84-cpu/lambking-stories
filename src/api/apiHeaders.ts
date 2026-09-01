/**
 * Shared request headers for every public API call.
 *
 *  - `X-Client-Key`: per-build attribution key. Each distribution channel
 *    (Tauri Android, GitHub Pages, Electron, …) ships its own value injected
 *    at build time via the matching `.env.<target>` file. The server's
 *    `requireClientKey` middleware uses it for attribution + as the trigger
 *    to flip CORS into permissive mode (so the Tauri WebView's
 *    `https://tauri.localhost` origin doesn't have to be allowlisted).
 *    Empty string disables the header — the server then falls back to
 *    legacy behaviour, which keeps `pnpm dev` against an unconfigured
 *    backend working.
 *  - `X-User-Uuid`: optional. The anonymous install id that feeds the
 *    /admin/usage daily-active-users dashboard. Defaults to the stored id
 *    from `useUserUuid`, which is empty outside the Tauri app — only the
 *    Android / iOS build is counted. Pass `userUuid` to override it, or `''`
 *    to send the request untracked.
 *
 * Both headers are announced in the server's permissive CORS branch
 * (`allowedHeaders` in server/src/app.ts) — adding another custom header
 * here without adding it there fails the preflight.
 */
import { getUserUuid } from '@/use/useUserUuid'

const CLIENT_KEY: string = (import.meta.env.VITE_CLIENT_KEY ?? '').trim()

export interface ApiHeaderOptions {
  /**
   * Anonymous install id sent as `X-User-Uuid`. Omit to use the stored one
   * (Tauri app only); pass an empty string to send no id at all.
   */
  userUuid?: string
}

export function buildApiHeaders(extra?: HeadersInit, options: ApiHeaderOptions = {}): HeadersInit {
  const userUuid = options.userUuid ?? getUserUuid()
  return {
    accept: 'application/json',
    ...(CLIENT_KEY ? { 'X-Client-Key': CLIENT_KEY } : {}),
    ...(userUuid ? { 'X-User-Uuid': userUuid } : {}),
    ...(extra ?? {})
  }
}
