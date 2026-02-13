import { LogOut, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

export default function POSLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
                <Link href="/pos" className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <LayoutGrid />
                    POS System
                </Link>
                <div className="flex items-center gap-4">
                    <form action="/api/auth/logout" method="POST">
                        <button className="flex items-center gap-2 text-sm font-medium text-red-600">
                            <LogOut size={16} />
                            Logout
                        </button>
                    </form>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto p-4">
                {children}
            </main>
        </div>
    )
}
