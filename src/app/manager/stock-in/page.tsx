'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Calendar, Package, Hash, Truck, CheckCircle2 } from 'lucide-react'

interface EggType {
    id: string
    name: string
}

export default function StockInPage() {
    const [eggTypes, setEggTypes] = useState<EggType[]>([])
    const [eggTypeId, setEggTypeId] = useState('')
    const [quantityTrays, setQuantityTrays] = useState('')
    // const [supplier, setSupplier] = useState('') // Not in backend yet, but UI required
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/egg-types').then(res => res.json()).then(data => setEggTypes(data.eggTypes || []))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMsg('')

        try {
            const res = await fetch('/api/inventory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eggTypeId,
                    quantityTrays: parseInt(quantityTrays),
                    // supplier 
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Failed to add stock')
            }

            setMsg('Stock added successfully!')
            setQuantityTrays('')
        } catch (error: any) {
            setMsg(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <Card className="w-full max-w-lg bg-white border border-sage/20 shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="bg-cream border-b border-sage/10 p-8 text-center">
                    <div className="mx-auto h-16 w-16 bg-sage/20 rounded-full flex items-center justify-center mb-4 text-sage-dark">
                        <Package size={32} />
                    </div>
                    <CardTitle className="text-2xl font-bold text-earth">New Stock Entry</CardTitle>
                    <CardDescription className="text-earth-light">Record incoming inventory from suppliers.</CardDescription>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    {msg && (
                        <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-medium ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                            {!msg.includes('Error') && <CheckCircle2 size={18} />}
                            {msg}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-earth font-medium flex items-center gap-2">
                                <Calendar size={16} className="text-sage" /> Date
                            </Label>
                            <Input
                                type="date"
                                className="bg-cream border-none shadow-inner rounded-xl h-12"
                                defaultValue={new Date().toISOString().split('T')[0]}
                                disabled
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-earth font-medium flex items-center gap-2">
                                <Package size={16} className="text-sage" /> Egg Type
                            </Label>
                            <div className="relative">
                                <select
                                    className="flex h-12 w-full items-center justify-between rounded-xl border-none bg-cream px-3 py-2 text-sm shadow-inner placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-sage disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    value={eggTypeId}
                                    onChange={(e) => setEggTypeId(e.target.value)}
                                    required
                                >
                                    <option value="">Select Type</option>
                                    {eggTypes.map((t) => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-earth-light">
                                    ▼
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-earth font-medium flex items-center gap-2">
                                <Hash size={16} className="text-sage" /> Quantity (Trays)
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 50"
                                className="bg-cream border-none shadow-inner rounded-xl h-12"
                                value={quantityTrays}
                                onChange={(e) => setQuantityTrays(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-earth font-medium flex items-center gap-2">
                                <Truck size={16} className="text-sage" /> Supplier
                            </Label>
                            <Input
                                type="text"
                                placeholder="e.g. Happy Hens Farm"
                                className="bg-cream border-none shadow-inner rounded-xl h-12"
                                disabled // Placeholder for now as backend doesn't support it
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 rounded-full bg-sage hover:bg-sage-dark text-white font-bold text-lg shadow-lg shadow-sage/30 transition-all hover:scale-[1.02]"
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add to Inventory'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
