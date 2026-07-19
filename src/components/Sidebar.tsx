'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  LayoutDashboard, PackageCheck, PackageMinus, ShoppingCart,
  Box, ClipboardList, Users, LogOut, Truck, ChevronRight
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
  { href: '/receiving', label: 'IN — Receiving', icon: PackageCheck },
  { href: '/deliveries', label: 'OUT — Deliveries', icon: PackageMinus },
  { href: '/trip-tickets', label: 'Trip Tickets', icon: Truck },
  { href: '/products', label: 'Products', icon: Box },
  { href: '/approvals', label: 'Approvals', icon: ClipboardList },
  { href: '/users', label: 'Users', icon: Users },
]

interface SidebarProps {
  userEmail?: string
  userRole?: string
}

export default function Sidebar({ userEmail, userRole }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const visibleItems = navItems.filter(item => {
    if (item.href === '/users' && userRole !== 'admin') return false
    if (item.href === '/approvals' && userRole === 'viewer') return false
    return true
  })

  return (
    <aside className="w-64 bg-blue-900 text-white flex flex-col min-h-screen">
      <div className="px-6 py-6 border-b border-blue-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
            <Box className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Lexis Product</p>
            <p className="text-blue-300 text-xs">Management</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map(item => {
          const Icon = item.icon
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group ${
                active ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {active && <ChevronRight className="w-3 h-3" />}
            </Link>
          )
        })}
      </nav>
      <div className="px-4 py-4 border-t border-blue-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
            {userEmail?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white truncate">{userEmail}</p>
            <p className="text-xs text-blue-300 capitalize">{userRole ?? 'viewer'}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-blue-300 hover:text-white text-sm w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
