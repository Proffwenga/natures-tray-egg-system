import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        // Get sales for today
        const todaySales = await prisma.transaction.findMany({
            where: {
                type: 'SALE',
                date: {
                    gte: startOfDay,
                },
                userId: session.id,
            },
        })

        const retailSales = todaySales
            .filter(s => s.saleCategory === 'RETAIL')
            .reduce((sum, s) => sum + s.totalAmount, 0)

        const wholesaleSales = todaySales
            .filter(s => s.saleCategory === 'WHOLESALE')
            .reduce((sum, s) => sum + s.totalAmount, 0)

        // Get current inventory total traits
        const inventory = await prisma.inventory.findMany({
            where: { userId: session.id },
        })

        const totalTrays = inventory.reduce((acc, item) => acc + Math.floor(item.goodEggs / 30), 0)

        return NextResponse.json({
            retailSales,
            wholesaleSales,
            totalTrays,
        })
    } catch (error) {
        console.error('Failed to fetch dashboard stats', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
