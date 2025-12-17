export function generateDeviceFingerprint(): string {
  if (typeof window === "undefined") {
    return "server-side"
  }

  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    !!window.sessionStorage,
    !!window.localStorage,
    navigator.platform,
  ]

  // Criar hash simples dos componentes
  const fingerprint = components.join("|")
  return btoa(fingerprint).substring(0, 64)
}
