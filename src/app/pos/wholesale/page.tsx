'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Trash2, Plus, Minus } from 'lucide-react'

interface EggType {
    id: string
    name: string
    priceTrayWholesale: number
}

interface Customer {
    id: string
    name: string
}

interface CartItem {
    eggTypeId: string
    name: string
    quantity: number // Trays
    price: number // Per Tray
}

export default function WholesalePOS() {
    const [eggTypes, setEggTypes] = useState<EggType[]>([])
    const [customers, setCustomers] = useState<Customer[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [selectedCustomer, setSelectedCustomer] = useState('')
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/egg-types').then(res => res.json()).then(data => setEggTypes(data.eggTypes || []))
        fetch('/api/customers').then(res => res.json()).then(data => setCustomers(data.customers || []))
    }, [])

    const addToCart = (type: EggType) => {
        setCart(prev => {
            const existing = prev.find(item => item.eggTypeId === type.id)
            if (existing) {
                return prev.map(item =>
                    item.eggTypeId === type.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { eggTypeId: type.id, name: type.name, quantity: 1, price: type.priceTrayWholesale }]
        })
    }

    const updateQuantity = (eggTypeId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.eggTypeId === eggTypeId) {
                const newQ = Math.max(1, item.quantity + delta)
                return { ...item, quantity: newQ }
            }
            return item
        }))
    }

    const removeFromCart = (eggTypeId: string) => {
        setCart(prev => prev.filter(item => item.eggTypeId !== eggTypeId))
    }

    const totalAmount = cart.reduce((sum, item) => sum + (item.quantity * item.price), 0)

    const handleSubmit = async () => {
        if (cart.length === 0) return
        if (paymentMethod === 'CREDIT' && !selectedCustomer) {
            setMsg('Error: Customer required for Credit')
            return
        }

        setLoading(true)
        setMsg('')

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'WHOLESALE',
                    customerId: selectedCustomer || undefined,
                    paymentMethod,
                    items: cart.map(item => ({
                        eggTypeId: item.eggTypeId,
                        quantity: item.quantity
                    }))
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Sale failed')
            }

            setMsg('Sale recorded successfully!')
            setCart([])
            setSelectedCustomer('')
            setPaymentMethod('CASH')
        } catch (error: any) {
            setMsg(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Product List */}
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-blue-800">Wholesale (Trays)</h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {eggTypes.map(type => (
                        <Card key={type.id} className="cursor-pointer hover:border-blue-500 transition-colors" onClick={() => addToCart(type)}>
                            <CardHeader className="p-4">
                                <CardTitle className="text-lg">{type.name}</CardTitle>
                                <div className="text-sm text-gray-500">KES {type.priceTrayWholesale} / Tray</div>
                            </CardHeader>
                            <CardContent className="p-4 pt-0">
                                <div className="text-xs text-blue-600 font-medium">Click to Add</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="md:col-span-1 space-y-4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle>Current Order</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                        {cart.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">Cart is empty</div>
                        ) : (
                            cart.map(item => (
                                <div key={item.eggTypeId} className="flex justify-between items-center border-b pb-2">
                                    <div>
                                        <div className="font-medium">{item.name}</div>
                                        <div className="text-xs text-gray-500">@ {item.price}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.eggTypeId, -1); }}>
                                            <Minus size={14} />
                                        </Button>
                                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); updateQuantity(item.eggTypeId, 1); }}>
                                            <Plus size={14} />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-6 w-6 ml-1" onClick={(e) => { e.stopPropagation(); removeFromCart(item.eggTypeId); }}>
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                    <div className="p-4 border-t bg-gray-50 space-y-4">
                        <div className="flex justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span>KES {totalAmount.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Customer (Optional if Cash)</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedCustomer}
                                onChange={(e) => setSelectedCustomer(e.target.value)}
                            >
                                <option value="">Select Customer</option>
                                {customers.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                            >
                                <option value="CASH">Cash</option>
                                <option value="MPESA">M-Pesa</option>
                                <option value="CREDIT">Credit (3 Days)</option>
                            </select>
                        </div>

                        {msg && (
                            <div className={`p-2 rounded text-sm ${msg.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {msg}
                            </div>
                        )}

                        <Button className="w-full" size="lg" onClick={handleSubmit} disabled={loading || cart.length === 0}>
                            {loading ? 'Processing...' : 'Complete Sale'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
