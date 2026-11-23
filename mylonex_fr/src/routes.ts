export const paths = {
  home: '/',
  login: '/auth/login',
  signup: '/auth/signup',
  callback: '/auth/callback',
  dashboards: {
    BUYER: '/buyer/dashboard',
    SUPPLIER: '/supplier/dashboard',
    ADMIN: '/admin/dashboard',
  },
} as const

const inquiryPath = /^\/(buyer|supplier)\/inquiries(?:\/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12})?$/i
export const adminReview = '/admin/rfq-review'

export function isAdminPath(path: string) {
  return path === paths.dashboards.ADMIN || path === adminReview
}

export function adminDestination(path: string) {
  const origin = new URL(import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174')
  if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password) {
    throw new Error('The admin portal URL must be an HTTP or HTTPS origin.')
  }
  if (origin.origin === window.location.origin) {
    throw new Error('The admin portal must run on a different origin from the buyer and supplier frontend.')
  }
  return new URL(path === adminReview ? adminReview : paths.dashboards.ADMIN, origin.origin).href
}

export function openAdmin(path: string) {
  try { window.location.replace(adminDestination(path)) }
  catch { window.location.replace(paths.login + '?admin=unavailable') }
}

export function portalRole(path: string) {
  const inquiryRole = inquiryPath.exec(path)?.[1]
  if (path === paths.dashboards.BUYER || path === '/buyer/fabrics' || path === '/buyer/chat' ||
      ['/buyer/profile', '/buyer/profile/edit', '/buyer/profile/password'].includes(path) ||
      inquiryRole === 'buyer' || path === '/buyer/inquiries/new') return 'BUYER'
  if (path === paths.dashboards.SUPPLIER || inquiryRole === 'supplier') return 'SUPPLIER'
}

const localPaths = new Set<string>([
  paths.home, paths.login, paths.signup, paths.callback, ...Object.values(paths.dashboards),
])

export function routePath(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/'
}

export function isLocalPath(pathname: string) {
  const path = routePath(pathname)
  return localPaths.has(path) || isAdminPath(path) || Boolean(portalRole(path))
}

export function replaceRoute(path: string, error?: string) {
  if (isAdminPath(path)) {
    openAdmin(path)
    return
  }
  window.history.replaceState(error ? { authError: error } : null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
