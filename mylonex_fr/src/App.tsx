import { lazy, Suspense, useEffect, useSyncExternalStore } from 'react'
import { isAdminPath, isLocalPath, openAdmin, paths, routePath } from './routes'
import FabricLoader from './shared/components/FabricLoader'

const Home = lazy(() => import('./features/home/LandingPage'))
const AccountRoutes = lazy(() => import('./AccountRoutes'))

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener)
  return () => window.removeEventListener('popstate', listener)
}

function AdminHandoff({ path }: { path: string }) {
  useEffect(() => { openAdmin(path) }, [path])
  return <main className="container-shell py-5">
    <p role="status">Opening the admin portal…</p>
  </main>
}

export default function App() {
  const href = useSyncExternalStore(subscribe, () => window.location.href)
  const path = routePath(new URL(href).pathname)
  return (
    <Suspense fallback={<div className="container-shell py-5"><FabricLoader label="Loading MyloNex…" /></div>}>
      {path === paths.home ? <Home /> : isAdminPath(path) ? <AdminHandoff path={path} /> :
        isLocalPath(path) ? <AccountRoutes href={href} path={path} /> : (
        <main className="container-shell py-12">
          <h1>Page not found</h1>
          <a className="text-primary underline" href={paths.home}>Back to MyloNex</a>
        </main>
      )}
    </Suspense>
  )
}
