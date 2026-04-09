// Single source of truth for the currently running app build.
// Populated either via real env (VITE_APP_BUILD_ID) or via Vite `define`.
export const APP_BUILD_ID =
  import.meta.env.VITE_APP_BUILD_ID ??
  // eslint-disable-next-line no-undef
  (typeof __APP_BUILD_ID__ !== 'undefined' ? __APP_BUILD_ID__ : null) ??
  'unknown'

