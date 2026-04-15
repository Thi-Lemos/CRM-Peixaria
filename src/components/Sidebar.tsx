import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MessageSquare,
  ShoppingBag,
  Package,
  Store,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useNotificationStore } from '../store/notificationStore'
import { FishIcon } from './FishIcon'
import { useState } from 'react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/conversas', icon: MessageSquare, label: 'Conversas' },
  { to: '/pedidos', icon: ShoppingBag, label: 'Pedidos' },
  { to: '/produtos', icon: Package, label: 'Produtos' },
  { to: '/loja', icon: Store, label: 'Informações da Loja' },
]

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuthStore()
  const { pendingOrdersCount } = useNotificationStore()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={onClose}
        />
      )}

      <aside
        className={`flex flex-col h-screen bg-[#0A2342] transition-all duration-300 fixed inset-y-0 left-0 z-50 lg:relative ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'w-16' : 'w-64'}`}
      >
        {/* Toggle collapse button (Desktop only) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-8 bg-[#0A2342] border border-white/20 rounded-full p-0.5 text-white hover:bg-navy-light transition-colors z-10"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? 'justify-center' : ''}`}>
          <FishIcon className="w-8 h-8 shrink-0" />
          {!collapsed && (
            <div>
              <span className="text-white font-bold text-base leading-tight block">RJ Peixaria</span>
              <span className="text-white/50 text-xs">CRM</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => {
                if (window.innerWidth < 1024) onClose()
              }}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-[8px] transition-all duration-150 relative group ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive
                    ? 'bg-[#FF6B1A] text-white font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <div className="relative shrink-0">
                <Icon className="w-5 h-5" />
                {to === '/pedidos' && pendingOrdersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#FF6B1A] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center pulse-orange">
                    {pendingOrdersCount > 9 ? '9+' : pendingOrdersCount}
                  </span>
                )}
              </div>

              {!collapsed && <span className="text-sm">{label}</span>}
              
              {/* Tooltip quando colapsado no desktop */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                  {label}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="border-t border-white/10 px-3 py-4">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="w-8 h-8 rounded-full bg-[#FF6B1A] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user?.email?.charAt(0).toUpperCase() ?? 'U'}
              </div>
              <div className="overflow-hidden">
                <p className="text-white text-xs font-medium truncate">{user?.email}</p>
                <p className="text-white/40 text-[10px]">Administrador</p>
              </div>
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-2 text-white/60 hover:text-white hover:bg-white/10 transition-all rounded-[8px] px-3 py-2 w-full text-sm ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
