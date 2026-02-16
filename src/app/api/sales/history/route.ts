import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const sales = await prisma.transaction.findMany({
            where: {
                type: 'SALE',
                userId: session.id,
            },
            include: {
                items: {
                    include: {
                        eggType: true,
                    },
                },
            },
            orderBy: {
                date: 'desc',
            },
        })

        return NextResponse.json({ sales })
    } catch (error) {
        console.error('Failed to fetch sales history', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
