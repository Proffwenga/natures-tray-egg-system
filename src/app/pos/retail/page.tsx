'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trash2, Plus, Minus } from 'lucide-react'

interface EggType {
    id: string
    name: string
    priceUnitRetail: number
}

interface CartItem {
    eggTypeId: string
    name: string
    quantity: number // Units
    price: number // Per Unit
}

export default function RetailPOS() {
    const [eggTypes, setEggTypes] = useState<EggType[]>([])
    const [cart, setCart] = useState<CartItem[]>([])
    const [paymentMethod, setPaymentMethod] = useState('CASH')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/egg-types').then(res => res.json()).then(data => setEggTypes(data.eggTypes || []))
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
            return [...prev, { eggTypeId: type.id, name: type.name, quantity: 1, price: type.priceUnitRetail }]
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

        setLoading(true)
        setMsg('')

        try {
            const res = await fetch('/api/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'RETAIL',
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
            setPaymentMethod('CASH')
        } catch (error: any) {
            setMsg(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
            {/* Product List - Retail Big Buttons */}
            <div className="md:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold text-green-800">Retail (Single Eggs)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eggTypes.map(type => (
                        <button
                            key={type.id}
                            className="h-32 rounded-xl bg-white border-2 border-green-100 hover:border-green-500 hover:bg-green-50 shadow-sm transition-all flex flex-col items-center justify-center p-4"
                            onClick={() => addToCart(type)}
                        >
                            <span className="text-xl font-bold text-green-900">{type.name}</span>
                            <span className="text-lg text-green-700 mt-2">KES {type.priceUnitRetail}</span>
                            <span className="text-xs text-green-500 mt-1">Tap to Add 1</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Cart & Checkout */}
            <div className="md:col-span-1 space-y-4">
                <Card className="h-full flex flex-col">
                    <CardHeader className="bg-gray-50 border-b">
                        <CardTitle>Retail Order</CardTitle>
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
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); updateQuantity(item.eggTypeId, -1); }}>
                                            <Minus size={16} />
                                        </Button>
                                        <span className="w-8 text-center font-bold text-lg">{item.quantity}</span>
                                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); updateQuantity(item.eggTypeId, 1); }}>
                                            <Plus size={16} />
                                        </Button>
                                        <Button size="icon" variant="destructive" className="h-8 w-8 ml-1" onClick={(e) => { e.stopPropagation(); removeFromCart(item.eggTypeId); }}>
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                    <div className="p-4 border-t bg-gray-50 space-y-4">
                        <div className="flex justify-between text-2xl font-bold text-green-800">
                            <span>Total:</span>
                            <span>KES {totalAmount.toFixed(2)}</span>
                        </div>

                        <div className="space-y-2">
                            <Label>Payment Method</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={paymentMethod === 'CASH' ? 'default' : 'outline'}
                                    onClick={() => setPaymentMethod('CASH')}
                                    className={paymentMethod === 'CASH' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    CASH
                                </Button>
                                <Button
                                    variant={paymentMethod === 'MPESA' ? 'default' : 'outline'}
                                    onClick={() => setPaymentMethod('MPESA')}
                                    className={paymentMethod === 'MPESA' ? 'bg-green-600 hover:bg-green-700' : ''}
                                >
                                    M-PESA
                                </Button>
                            </div>
                        </div>

                        {msg && (
                            <div className={`p-2 rounded text-sm ${msg.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {msg}
                            </div>
                        )}

                        <Button className="w-full h-16 text-xl bg-green-600 hover:bg-green-700" onClick={handleSubmit} disabled={loading || cart.length === 0}>
                            {loading ? 'Processing...' : 'PAY & COMPLETE'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    )
}
