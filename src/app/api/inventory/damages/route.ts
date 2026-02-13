import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const DamageSchema = z.object({
    eggTypeId: z.string(),
    quantityDamaged: z.number().int().positive(), // Total Good eggs lost
    quantityCracked: z.number().int().nonnegative(), // Resulting Cracked
    quantitySpoiled: z.number().int().nonnegative(), // Resulting Spoiled
})

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { eggTypeId, quantityDamaged, quantityCracked, quantitySpoiled } = DamageSchema.parse(body)

        if (quantityCracked + quantitySpoiled !== quantityDamaged) {
            return NextResponse.json(
                { error: 'Sum of Cracked and Spoiled must equal Total Damaged' },
                { status: 400 }
            )
        }

        const stock = await prisma.inventory.findUnique({
            where: {
                userId_eggTypeId: {
                    userId: session.id,
                    eggTypeId,
                },
            },
        })

        if (!stock || stock.goodEggs < quantityDamaged) {
            return NextResponse.json({ error: 'Insufficient stock' }, { status: 400 })
        }

        const result = await prisma.$transaction(async (tx) => {
            // 1. Record Transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'DAMAGE',
                    userId: session.id,
                    items: {
                        create: {
                            eggTypeId,
                            quantityEggs: quantityDamaged,
                            unitPrice: 0,
                        },
                    },
                },
            })

            // 2. Update Inventory
            await tx.inventory.update({
                where: {
                    userId_eggTypeId: {
                        userId: session.id,
                        eggTypeId,
                    },
                },
                data: {
                    goodEggs: { decrement: quantityDamaged },
                    crackedEggs: { increment: quantityCracked },
                    spoiledEggs: { increment: quantitySpoiled },
                },
            })

            return transaction
        })

        return NextResponse.json(result)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
