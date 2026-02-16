'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search, Filter, Calendar as CalendarIcon, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TransactionItem {
    eggType: { name: string }
    quantityEggs: number
    unitPrice: number
}

interface Transaction {
    id: string
    type: string // SALE, STOCK_IN
    saleCategory: string // RETAIL, WHOLESALE
    date: string
    totalAmount: number
    paymentMethod: string
    items: TransactionItem[]
}

export default function SalesHistoryPage() {
    const [sales, setSales] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('ALL')

    useEffect(() => {
        fetchSales()
    }, [])

    const fetchSales = async () => {
        try {
            // Reusing existing API if possible or fetching all transactions
            // For now, let's fetch inventory/stats or similar
            const res = await fetch('/api/sales/history') // We'll need this endpoint or a general transactions one
            if (res.ok) {
                const data = await res.json()
                setSales(data.sales)
            }
        } catch (error) {
            console.error('Failed to fetch sales', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredSales = sales.filter(s => {
        const matchesSearch = s.id.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = categoryFilter === 'ALL' || s.saleCategory === categoryFilter
        return matchesSearch && matchesCategory
    })

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-sage" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-earth">Sales History</h1>
                    <p className="text-earth-light">View and manage all sales transactions.</p>
                </div>
            </div>

            <Card className="bg-white border-none shadow-sm rounded-2xl p-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-earth-light" size={18} />
                        <Input
                            className="pl-10 bg-cream border-none rounded-xl"
                            placeholder="Search by Transaction ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant={categoryFilter === 'ALL' ? 'default' : 'outline'}
                            onClick={() => setCategoryFilter('ALL')}
                            className={categoryFilter === 'ALL' ? 'bg-sage hover:bg-sage-dark' : ''}
                        >
                            All
                        </Button>
                        <Button
                            variant={categoryFilter === 'RETAIL' ? 'default' : 'outline'}
                            onClick={() => setCategoryFilter('RETAIL')}
                            className={categoryFilter === 'RETAIL' ? 'bg-golden hover:bg-golden' : ''}
                        >
                            Retail
                        </Button>
                        <Button
                            variant={categoryFilter === 'WHOLESALE' ? 'default' : 'outline'}
                            onClick={() => setCategoryFilter('WHOLESALE')}
                            className={categoryFilter === 'WHOLESALE' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                        >
                            Wholesale
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid gap-4">
                {filteredSales.map((sale) => (
                    <Card key={sale.id} className="bg-white border-none shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-full ${sale.saleCategory === 'WHOLESALE' ? 'bg-blue-50 text-blue-500' : 'bg-golden/10 text-golden'}`}>
                                        <ArrowUpRight size={24} />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-earth">{sale.saleCategory} SALE</span>
                                            <span className="text-xs px-2 py-0.5 bg-cream rounded-full text-earth-light">#{sale.id.slice(-6)}</span>
                                        </div>
                                        <p className="text-sm text-earth-light">{new Date(sale.date).toLocaleString()}</p>
                                        <div className="mt-1 flex gap-2">
                                            {sale.items.map((item, idx) => (
                                                <span key={idx} className="text-xs font-medium bg-cream px-2 py-1 rounded text-sage-dark">
                                                    {item.eggType.name} x {sale.saleCategory === 'WHOLESALE' ? item.quantityEggs / 30 + ' Trays' : item.quantityEggs + ' Eggs'}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-center">
                                    <div className="text-2xl font-bold text-earth">KES {sale.totalAmount.toLocaleString()}</div>
                                    <div className="text-sm font-medium text-sage">{sale.paymentMethod}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredSales.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-cream text-earth-light">
                        No sales found matching your filters.
                    </div>
                )}
            </div>
        </div>
    )
}
