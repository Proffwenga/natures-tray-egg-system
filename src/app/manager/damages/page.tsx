'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface EggType {
    id: string
    name: string
}

export default function DamagesPage() {
    const [eggTypes, setEggTypes] = useState<EggType[]>([])
    const [selectedType, setSelectedType] = useState('')
    const [damaged, setDamaged] = useState('')
    const [cracked, setCracked] = useState('')
    const [spoiled, setSpoiled] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/egg-types').then(res => res.json()).then(data => setEggTypes(data.eggTypes || []))
    }, [])

    // Auto calculate spoiled if damaged and cracked are set?
    useEffect(() => {
        const d = parseInt(damaged) || 0
        const c = parseInt(cracked) || 0
        if (d >= c) {
            setSpoiled((d - c).toString())
        }
    }, [damaged, cracked])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMsg('')

        try {
            const res = await fetch('/api/inventory/damages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eggTypeId: selectedType,
                    quantityDamaged: parseInt(damaged),
                    quantityCracked: parseInt(cracked),
                    quantitySpoiled: parseInt(spoiled),
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Report failed')
            }

            setMsg('Incident reported successfully!')
            setDamaged('')
            setCracked('')
            setSpoiled('')
        } catch (error: any) {
            setMsg(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Report Damages</CardTitle>
                    <CardDescription>Log broken eggs (Good &gt; Cracked/Spoiled).</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {msg && (
                            <div className={`p-2 rounded text-sm ${msg.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {msg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Egg Type</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                required
                            >
                                <option value="">Select Type</option>
                                {eggTypes.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Total Good Eggs Damaged</Label>
                            <Input
                                type="number"
                                min="1"
                                value={damaged}
                                onChange={(e) => setDamaged(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Salvageable (Cracked)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={cracked}
                                    onChange={(e) => setCracked(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Loss (Spoiled)</Label>
                                <Input
                                    type="number"
                                    value={spoiled}
                                    readOnly
                                    className="bg-gray-100"
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Submitting...' : 'Log Incident'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
