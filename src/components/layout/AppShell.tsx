import { Outlet } from 'react-router-dom'
import { useWateringNotifications } from '../../hooks/useWateringNotifications'
import { BottomNav } from './BottomNav'

export function AppShell() {
  useWateringNotifications()
  return (
    <div className="min-h-dvh">
      {/* pb deja hueco para la barra inferior */}
      <main className="mx-auto max-w-lg pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
