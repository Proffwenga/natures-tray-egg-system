import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const TransferSchema = z.object({
    toUserId: z.string(),
    eggTypeId: z.string(),
    quantityTrays: z.number().int().positive(),
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
        const { toUserId, eggTypeId, quantityTrays } = TransferSchema.parse(body)

        const quantityEggs = quantityTrays * 30

        // Check if manager has enough stock (optional but good)
        const managerStock = await prisma.inventory.findUnique({
            where: {
                userId_eggTypeId: {
                    userId: session.id,
                    eggTypeId,
                },
            },
        })

        if (!managerStock || managerStock.goodEggs < quantityEggs) {
            return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create TransactionRecord
            const transaction = await tx.transaction.create({
                data: {
                    type: 'ISSUE',
                    userId: session.id, // Initiated by Manager
                    items: {
                        create: {
                            eggTypeId,
                            quantityEggs,
                            unitPrice: 0, // Transfer has 0 cost or carry over? 0 for now as it's internal.
                        },
                    },
                },
            })

            // 2. Decrement Manager Stock
            await tx.inventory.update({
                where: {
                    userId_eggTypeId: {
                        userId: session.id,
                        eggTypeId,
                    },
                },
                data: {
                    goodEggs: { decrement: quantityEggs },
                },
            })

            // 3. Increment Sales Person Stock
            await tx.inventory.upsert({
                where: {
                    userId_eggTypeId: {
                        userId: toUserId,
                        eggTypeId,
                    },
                },
                update: {
                    goodEggs: { increment: quantityEggs },
                },
                create: {
                    userId: toUserId,
                    eggTypeId,
                    goodEggs: quantityEggs,
                },
            })

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
