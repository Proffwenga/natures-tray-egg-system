'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, TrendingUp, AlertTriangle, Package, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

// Types
interface InventoryItem {
    id: string
    eggType: { id: string; name: string }
    goodEggs: number
    crackedEggs: number
    spoiledEggs: number
}

interface Stats {
    retailSales: number
    wholesaleSales: number
    totalTrays: number
}

export default function ManagerDashboard() {
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [stats, setStats] = useState<Stats>({ retailSales: 0, wholesaleSales: 0, totalTrays: 0 })
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [invRes, statsRes] = await Promise.all([
                fetch('/api/inventory'),
                fetch('/api/dashboard/stats')
            ])

            if (invRes.ok) {
                const data = await invRes.json()
                setInventory(data.inventory)
            }
            if (statsRes.ok) {
                const data = await statsRes.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch data', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-sage" /></div>
    }

    const filteredInventory = inventory.filter(item =>
        item.eggType.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-earth tracking-tight">Dashboard Overview</h1>
                <p className="text-earth-light">Welcome back, here's what's happening today.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-earth-light">Total Trays in Stock</p>
                            <h3 className="text-4xl font-bold text-sage-dark mt-2">{stats.totalTrays}</h3>
                        </div>
                        <div className="h-12 w-12 bg-cream rounded-full flex items-center justify-center text-sage-dark">
                            <Package size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-earth-light">Daily Retail Sales (KES)</p>
                            <h3 className="text-4xl font-bold text-golden mt-2">{stats.retailSales.toLocaleString()}</h3>
                        </div>
                        <div className="h-12 w-12 bg-cream rounded-full flex items-center justify-center text-golden">
                            <TrendingUp size={24} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-earth-light">Daily Wholesale Sales (KES)</p>
                            <h3 className="text-4xl font-bold text-blue-500 mt-2">{stats.wholesaleSales.toLocaleString()}</h3>
                        </div>
                        <div className="h-12 w-12 bg-cream rounded-full flex items-center justify-center text-blue-500">
                            <TrendingUp size={24} />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Chart Section (Placeholder) */}
            <Card className="bg-white border-none shadow-sm rounded-2xl p-6">
                <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-xl font-bold text-earth">Stock Trends (7 Days)</CardTitle>
                </CardHeader>
                <div className="h-64 bg-cream rounded-xl flex items-center justify-center border-2 border-dashed border-sage/20 text-earth-light">
                    [ Line Chart Visualization Would Go Here ]
                </div>
            </Card>

            {/* Inventory Grid */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-2xl font-bold text-earth">Current Inventory</h2>
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-light" size={18} />
                        <Input
                            className="pl-10 bg-white border-none shadow-sm rounded-full placeholder:text-earth-light/50"
                            placeholder="Search egg types..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {filteredInventory.map((item) => (
                        <Card key={item.id} className="bg-white border-none shadow-sm rounded-2xl hover:shadow-lg transition-all duration-300 group">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-bold text-earth">
                                    {item.eggType.name}
                                </CardTitle>
                                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-xs
                                    ${item.eggType.name === 'Jumbo' ? 'bg-golden' :
                                        item.eggType.name === 'Normal' ? 'bg-sage' : 'bg-earth-light'}`}>
                                    {item.eggType.name[0]}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-earth mt-2">{Math.floor(item.goodEggs / 30)} <span className="text-sm font-normal text-earth-light">Trays</span></div>
                                <div className="mt-4 space-y-2 text-sm">
                                    <div className="flex justify-between p-2 bg-cream rounded-lg">
                                        <span className="text-earth-light">Loose</span>
                                        <span className="font-semibold text-earth">{item.goodEggs % 30}</span>
                                    </div>
                                    <div className="flex justify-between p-2 bg-cream rounded-lg">
                                        <span className="text-earth-light">Damaged</span>
                                        <span className="font-semibold text-red-500">{item.crackedEggs + item.spoiledEggs}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {filteredInventory.length === 0 && (
                        <div className="col-span-full py-12 text-center text-earth-light bg-white rounded-2xl border border-dashed border-cream">
                            No inventory items found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
