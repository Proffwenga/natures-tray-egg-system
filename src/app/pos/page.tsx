'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Truck, ShoppingBasket } from 'lucide-react'

export default function POSModeSelection() {
    return (
        <div className="flex flex-col items-center justify-center h-full space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Select Sales Mode</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl px-4">
                <Link href="/pos/wholesale" className="group">
                    <Card className="h-48 flex items-center justify-center transition-all hover:bg-blue-50 border-blue-200 hover:border-blue-400 cursor-pointer">
                        <CardContent className="flex flex-col items-center space-y-4">
                            <Truck size={48} className="text-blue-500 group-hover:scale-110 transition-transform" />
                            <span className="text-2xl font-semibold text-blue-700">Wholesale (Trays)</span>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/pos/retail" className="group">
                    <Card className="h-48 flex items-center justify-center transition-all hover:bg-green-50 border-green-200 hover:border-green-400 cursor-pointer">
                        <CardContent className="flex flex-col items-center space-y-4">
                            <ShoppingBasket size={48} className="text-green-500 group-hover:scale-110 transition-transform" />
                            <span className="text-2xl font-semibold text-green-700">Retail (Individual)</span>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
