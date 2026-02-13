import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ReconciliationItemSchema = z.object({
    eggTypeId: z.string(),
    actualGood: z.number().int().nonnegative(),
    actualCracked: z.number().int().nonnegative(),
    actualSpoiled: z.number().int().nonnegative(),
})

const ReconciliationSchema = z.object({
    salesPersonId: z.string(),
    items: z.array(ReconciliationItemSchema),
})

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
        const { salesPersonId, items } = ReconciliationSchema.parse(body)

        // Fetch current stock to calculate variance
        const currentInventory = await prisma.inventory.findMany({
            where: { userId: salesPersonId },
        })
        const inventoryMap = new Map(currentInventory.map(i => [i.eggTypeId, i]))

        // We need to record the reconciliation transaction
        // And update the inventory to match actuals

        // items should cover all egg types? Or just ones provided?
        // Usually all. If not provided, assume old value or 0? 
        // Requirement says "System displays: Opening Stock + Issued - Sold = Expected Stock."
        // "Manager enters: Actual Physical Stock Returned".
        // So we are forcing the inventory to match Actual.

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'RECONCILIATION',
                    userId: salesPersonId,
                    totalAmount: 0,
                    items: {
                        create: items.map(item => {
                            const stock = inventoryMap.get(item.eggTypeId)
                            const expectedGood = stock?.goodEggs || 0

                            // Calculate variance in Good eggs (which are the primary trackable unit for value)
                            const diffGood = item.actualGood - expectedGood

                            return {
                                eggTypeId: item.eggTypeId,
                                quantityEggs: diffGood,
                                unitPrice: 0
                            }
                        })
                    }
                }
            })

            // 2. Update Inventory to Actuals
            for (const item of items) {
                await tx.inventory.upsert({
                    where: {
                        userId_eggTypeId: {
                            userId: salesPersonId,
                            eggTypeId: item.eggTypeId,
                        },
                    },
                    update: {
                        goodEggs: item.actualGood,
                        crackedEggs: item.actualCracked,
                        spoiledEggs: item.actualSpoiled,
                    },
                    create: {
                        userId: salesPersonId,
                        eggTypeId: item.eggTypeId,
                        goodEggs: item.actualGood,
                        crackedEggs: item.actualCracked,
                        spoiledEggs: item.actualSpoiled,
                    },
                })
            }

            return transaction
        })

        return NextResponse.json(result)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
