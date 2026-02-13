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

interface EggType {
    id: string
    name: string
}

export default function TransferPage() {
    const [salesPersons, setSalesPersons] = useState<User[]>([])
    const [eggTypes, setEggTypes] = useState<EggType[]>([])
    const [selectedUser, setSelectedUser] = useState('')
    const [selectedType, setSelectedType] = useState('')
    const [quantityTrays, setQuantityTrays] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => {
        fetch('/api/users?role=SALES_PERSON').then(res => res.json()).then(data => setSalesPersons(data.users || []))
        fetch('/api/egg-types').then(res => res.json()).then(data => setEggTypes(data.eggTypes || []))
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMsg('')

        try {
            const res = await fetch('/api/inventory/transfer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    toUserId: selectedUser,
                    eggTypeId: selectedType,
                    quantityTrays: parseInt(quantityTrays),
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Transfer failed')
            }

            setMsg('Stock transferred successfully!')
            setQuantityTrays('')
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
                    <CardTitle>Transfer Stock</CardTitle>
                    <CardDescription>Issue stock to a Sales Person (Trays).</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {msg && (
                            <div className={`p-2 rounded text-sm ${msg.includes('Error') ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                {msg}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Sales Person</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                required
                            >
                                <option value="">Select Sales Person</option>
                                {salesPersons.map((u) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Egg Type</Label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                            <Label>Quantity (Trays)</Label>
                            <Input
                                type="number"
                                min="1"
                                placeholder="e.g. 10"
                                value={quantityTrays}
                                onChange={(e) => setQuantityTrays(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Transferring...' : 'Transfer Stock'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
