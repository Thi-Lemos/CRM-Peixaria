import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useState } from 'react'
import { Menu } from 'lucide-react'

export function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex bg-[#F4F6F9] min-h-screen">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <main className="flex-1 overflow-x-hidden min-h-screen relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#0A2342] text-white sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm">RJ Peixaria CRM</span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </header>

        <Outlet />
      </main>
    </div>
  )
}
