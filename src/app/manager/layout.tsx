'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, PackagePlus, ArrowRightLeft, ClipboardCheck, AlertTriangle, LogOut, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()

    const navigation = [
        { name: 'Dashboard', href: '/manager', icon: LayoutDashboard },
        { name: 'Stock In', href: '/manager/stock-in', icon: PackagePlus },
        { name: 'Sales History', href: '/manager/sales', icon: TrendingUp },
        { name: 'Transfer Stock', href: '/manager/transfer', icon: ArrowRightLeft },
        { name: 'Reconciliation', href: '/manager/reconcile', icon: ClipboardCheck },
        { name: 'Incidents', href: '/manager/damages', icon: AlertTriangle },
    ]

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        window.location.href = '/login'
    }

    return (
        <div className="flex h-screen bg-cream text-earth font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-cream shadow-sm flex flex-col">
                <div className="p-6 flex flex-col items-center gap-2">
                    <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Basket */}
                        <ellipse cx="50" cy="75" rx="35" ry="8" fill="#D2691E" opacity="0.3" />
                        <path d="M20 70 L25 55 L75 55 L80 70 Z" fill="#CD853F" stroke="#8B4513" strokeWidth="2" />
                        <path d="M25 55 L75 55" stroke="#8B4513" strokeWidth="1" />
                        <path d="M30 55 L32 70" stroke="#8B4513" strokeWidth="1" />
                        <path d="M40 55 L42 70" stroke="#8B4513" strokeWidth="1" />
                        <path d="M50 55 L52 70" stroke="#8B4513" strokeWidth="1" />
                        <path d="M60 55 L62 70" stroke="#8B4513" strokeWidth="1" />
                        <path d="M70 55 L72 70" stroke="#8B4513" strokeWidth="1" />

                        {/* Egg character */}
                        <ellipse cx="50" cy="40" rx="20" ry="25" fill="#FFF8E7" stroke="#5D4037" strokeWidth="2" />
                        <circle cx="50" cy="48" r="8" fill="#F4C430" />

                        {/* Face */}
                        <circle cx="44" cy="35" r="2" fill="#5D4037" />
                        <circle cx="56" cy="35" r="2" fill="#5D4037" />
                        <path d="M 45 42 Q 50 45 55 42" stroke="#5D4037" strokeWidth="2" fill="none" strokeLinecap="round" />

                        {/* Blush */}
                        <circle cx="40" cy="38" r="3" fill="#FFB6C1" opacity="0.5" />
                        <circle cx="60" cy="38" r="3" fill="#FFB6C1" opacity="0.5" />

                        {/* Leaf on top */}
                        <ellipse cx="50" cy="15" rx="4" ry="8" fill="#8DA47E" stroke="#5D4037" strokeWidth="1.5" transform="rotate(-20 50 15)" />
                    </svg>
                    <span className="text-lg font-bold tracking-tight text-earth text-center leading-tight">Nature's<br />Tray & Table</span>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 ${isActive
                                    ? 'bg-sage text-white shadow-md'
                                    : 'text-earth hover:bg-cream hover:text-sage-dark'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-cream">
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-2xl"
                        onClick={handleLogout}
                    >
                        <LogOut size={20} />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto bg-cream p-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
