const OUDER_INSTELLINGEN_PATH_PREFIXES = [
  '/dashboard/ouder/instellingen',
  '/dashboard/ouder/account-bewerken',
  '/dashboard/ouder/kindprofielen',
  '/dashboard/ouder/kind-activeren',
]

export function isOuderInstellingenPath(pathname) {
  return OUDER_INSTELLINGEN_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}
