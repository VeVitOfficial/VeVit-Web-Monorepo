/** Protocol endpoints of the OIDC provider: fixed, locale-less URLs under the issuer that the locale proxy must not touch. */
export function isOidcProtocolPath(pathname: string): boolean {
  return pathname.startsWith("/account/.well-known/") || pathname.startsWith("/account/oidc/");
}
