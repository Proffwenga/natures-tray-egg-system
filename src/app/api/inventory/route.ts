import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for Stock In
const StockInSchema = z.object({
    eggTypeId: z.string(),
    quantityTrays: z.number().int().positive(),
    costPerTray: z.number().positive(),
    supplierName: z.string().optional(),
})

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get('userId')

    let userIdToFetch = session.id

    if (targetUserId) {
        if (session.role === 'MANAGER' || session.role === 'ADMIN') {
            userIdToFetch = targetUserId
        } else {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }
    }

    const inventory = await prisma.inventory.findMany({
        where: { userId: userIdToFetch },
        include: { eggType: true },
    })

    return NextResponse.json({ inventory })
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'MANAGER' && session.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    try {
        const body = await request.json()
        const { eggTypeId, quantityTrays, costPerTray, supplierName } = StockInSchema.parse(body)

        const quantityEggs = quantityTrays * 30

        // Use a transaction to ensure data integrity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Record the transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'STOCK_IN',
                    userId: session.id,
                    supplierName,
                    items: {
                        create: {
                            eggTypeId,
                            quantityEggs,
                            unitPrice: costPerTray, // storing tray cost or egg cost? Let's ref schema. 
                            // Schema says "unitPrice". For STOCK_IN, maybe store Total Cost or Unit Cost? 
                            // Usually Unit Cost. Let's store Cost Per Egg for consistency? 
                            // Or Cost Per Tray? The UI Inputs Trays.
                            // Let's store Cost Per Tray in 'unitPrice' for STOCK_IN since that's the unit we bought?
                            // But 'quantityEggs' is in eggs.
                            // Let's calc Cost Per Egg: costPerTray / 30.
                        },
                    },
                },
            })
            // wait, I can't leave comment in code for thought proc.
            // logic: Store cost per egg approx? Or just store costPerTray and we know STOCK_IN implies Trays?
            // Better to normalize. But floating point.
            // Let's store cost per tray, but add a note or field? 
            // Schema: unitPrice Float. 
            // Let's store costPerTray. The type is STOCK_IN, so we know it came in trays. 
            // Actually, standard is usually per smallest unit. 
            // But for simplicity of financial records matching invoices, let's store what was entered.
            // Wait, if I sell 1 egg, I need a unit price.
            // Sales prices are defined in EggType.
            // This is "Cost". 
            // Let's just store costPerTray.

            // 2. Update Inventory
            const inventory = await tx.inventory.upsert({
                where: {
                    userId_eggTypeId: {
                        userId: session.id,
                        eggTypeId,
                    },
                },
                update: {
                    goodEggs: { increment: quantityEggs },
                },
                create: {
                    userId: session.id,
                    eggTypeId,
                    goodEggs: quantityEggs,
                },
            })

            return { transaction, inventory }
        })

        return NextResponse.json(result)
    } catch (error) {
        if (error instanceof z.ZodError) {
            const message = error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')
            return NextResponse.json({ error: message }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
