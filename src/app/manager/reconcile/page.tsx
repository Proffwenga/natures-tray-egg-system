'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface User {
    id: string
    name: string
}

interface InventoryItem {
    id: string
    eggTypeId: string
    eggType: { name: string }
    goodEggs: number
    crackedEggs: number
    spoiledEggs: number
}

export default function ReconcilePage() {
    const [salesPersons, setSalesPersons] = useState<User[]>([])
    const [selectedUser, setSelectedUser] = useState('')
    const [userInventory, setUserInventory] = useState<InventoryItem[]>([])

    // State for actuals: map eggTypeId -> { good, cracked, spoiled }
    const [actuals, setActuals] = useState<Record<string, { good: number, cracked: number, spoiled: number }>>({})

    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/users?role=SALES_PERSON').then(res => res.json()).then(data => setSalesPersons(data.users || []))
    }, [])

    useEffect(() => {
        if (selectedUser) {
            fetch(`/api/inventory?userId=${selectedUser}`)
                .then(res => res.json())
                .then(data => {
                    setUserInventory(data.inventory || [])
                    // Initialize actuals with current values to make it easier
                    const initActuals: any = {}
                    data.inventory?.forEach((item: InventoryItem) => {
                        initActuals[item.eggTypeId] = {
                            good: item.goodEggs,
                            cracked: item.crackedEggs,
                            spoiled: item.spoiledEggs
                        }
                    })
                    setActuals(initActuals)
                })
        } else {
            setUserInventory([])
            setActuals({})
        }
    }, [selectedUser])

    const handleActualChange = (eggTypeId: string, field: 'good' | 'cracked' | 'spoiled', value: number) => {
        setActuals(prev => ({
            ...prev,
            [eggTypeId]: {
                ...prev[eggTypeId],
                [field]: value
            }
        }))
    }

    const handleSubmit = async () => {
        setLoading(true)
        setMsg('')

        try {
            const items = Object.entries(actuals).map(([eggTypeId, counts]) => ({
                eggTypeId,
                actualGood: counts.good,
                actualCracked: counts.cracked,
                actualSpoiled: counts.spoiled
            }))

            const res = await fetch('/api/reconciliation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    salesPersonId: selectedUser,
                    items
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Reconciliation failed')
            }

            setMsg('Reconciliation complete!')
            setSelectedUser('')
            // Reset logic could be better but sufficient for now
        } catch (error: any) {
            setMsg(`Error: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Reconciliation</CardTitle>
                    <CardDescription>End of Day Stock Check.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {msg && (
                        <div className={`p-2 rounded text-sm ${msg.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {msg}
                        </div>
                    )}

                    <div className="space-y-2 max-w-md">
                        <Label>Select Sales Person</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                        >
                            <option value="">Select...</option>
                            {salesPersons.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedUser && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Inventory Comparison</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2">Egg Type</th>
                                            <th className="p-2">Expected (Good/Cracked/Spoiled)</th>
                                            <th className="p-2">Actual (Good)</th>
                                            <th className="p-2">Actual (Cracked)</th>
                                            <th className="p-2">Actual (Spoiled)</th>
                                            <th className="p-2">Variance (Good)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {userInventory.map(item => {
                                            const act = actuals[item.eggTypeId] || { good: 0, cracked: 0, spoiled: 0 }
                                            const varGood = (act.good - item.goodEggs)
                                            return (
                                                <tr key={item.id} className="border-b">
                                                    <td className="p-2 font-medium">{item.eggType.name}</td>
                                                    <td className="p-2">
                                                        <span className="text-green-600">{item.goodEggs}</span> /
                                                        <span className="text-yellow-600"> {item.crackedEggs}</span> /
                                                        <span className="text-red-600"> {item.spoiledEggs}</span>
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            type="number" className="w-20"
                                                            value={act.good}
                                                            onChange={e => handleActualChange(item.eggTypeId, 'good', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            type="number" className="w-20"
                                                            value={act.cracked}
                                                            onChange={e => handleActualChange(item.eggTypeId, 'cracked', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="p-2">
                                                        <Input
                                                            type="number" className="w-20"
                                                            value={act.spoiled}
                                                            onChange={e => handleActualChange(item.eggTypeId, 'spoiled', parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className={`p-2 font-bold ${varGood < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                        {varGood}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Button onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Submitting...' : 'Confirm Reconciliation'}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
