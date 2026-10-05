import clsx from 'clsx'
import { Droplets, Leaf, Settings, Stethoscope } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Hoy', icon: Droplets, end: true },
  { to: '/plantas', label: 'Plantas', icon: Leaf, end: false },
  { to: '/diagnostico', label: 'Diagnóstico', icon: Stethoscope, end: false },
  { to: '/ajustes', label: 'Ajustes', icon: Settings, end: false },
]

export function BottomNav() {
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-lg">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition',
                  isActive ? 'text-accent' : 'text-muted',
                )
              }
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
