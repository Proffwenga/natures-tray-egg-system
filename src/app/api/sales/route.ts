import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const SalesItemSchema = z.object({
    eggTypeId: z.string(),
    quantity: z.number().int().positive(),
    // unitType is handled by logic based on 'type' (WHOLESALE/RETAIL)
})

const SalesSchema = z.object({
    type: z.enum(['WHOLESALE', 'RETAIL']),
    customerId: z.string().optional(),
    paymentMethod: z.enum(['CASH', 'MPESA', 'CREDIT']),
    items: z.array(SalesItemSchema),
})

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { type, customerId, paymentMethod, items } = SalesSchema.parse(body)

        // Validation
        if (type === 'RETAIL' && paymentMethod === 'CREDIT') {
            return NextResponse.json({ error: 'Retail cannot be Credit' }, { status: 400 })
        }

        if (paymentMethod === 'CREDIT' && !customerId) {
            return NextResponse.json({ error: 'Customer required for Credit sales' }, { status: 400 })
        }

        // Determine due date
        let dueDate = null
        const isCredit = paymentMethod === 'CREDIT'
        if (isCredit) {
            const d = new Date()
            d.setDate(d.getDate() + 3)
            dueDate = d
        }

        // Calculate total and prepare transaction items
        let calculatedTotalAmount = 0
        const transactionItemsData = []

        // Fetch Egg Types to get prices
        const eggTypes = await prisma.eggType.findMany()
        const eggTypeMap = new Map(eggTypes.map(t => [t.id, t]))

        // Check Stock
        // We need to check stock for each item *before* transaction?
        // Or just let transaction fail? Better to check first.
        // Fetch inventory
        const inventory = await prisma.inventory.findMany({
            where: { userId: session.id },
        })
        const stockMap = new Map(inventory.map(i => [i.eggTypeId, i]))

        for (const item of items) {
            const eggType = eggTypeMap.get(item.eggTypeId)
            if (!eggType) {
                return NextResponse.json({ error: `Invalid Egg Type: ${item.eggTypeId}` }, { status: 400 })
            }

            let quantityEggs = 0
            let unitPrice = 0

            if (type === 'WHOLESALE') {
                quantityEggs = item.quantity * 30
                // Price calculation: Usually wholesale price is per tray.
                // If 1 Tray = 450, unitPrice stored in TransactionItem?
                // Let's store Price Per Egg or Total Amount?
                // Schema checks: TransactionItem.unitPrice Float.
                // Usually unit price of the item sold. If sold as Trays, store Tray Price?
                // But schema `quantityEggs` implies atomic units. 
                // Let's store effective price per egg: trayPrice / 30.
                // Wait, floating point issues.
                // Let's store precise amounts.
                // Actually, if I sell 2 Trays @ 450, Total = 900.
                // Items: q=60 eggs. unitPrice = 15.
                // 60 * 15 = 900. Correct.
                unitPrice = eggType.priceTrayWholesale / 30
            } else {
                quantityEggs = item.quantity
                unitPrice = eggType.priceUnitRetail
            }

            // Stock Check
            const stock = stockMap.get(item.eggTypeId)
            if (!stock || stock.goodEggs < quantityEggs) {
                return NextResponse.json(
                    { error: `Insufficient stock for ${eggType.name}` },
                    { status: 400 }
                )
            }

            calculatedTotalAmount += quantityEggs * unitPrice
            // Reduce stock in memory map for multiple items of same type (unlikely but safe)
            stock.goodEggs -= quantityEggs

            transactionItemsData.push({
                eggTypeId: item.eggTypeId,
                quantityEggs,
                unitPrice,
            })
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction
            const transaction = await tx.transaction.create({
                data: {
                    type: 'SALE',
                    userId: session.id,
                    customerId,
                    paymentMethod,
                    isCredit,
                    dueDate,
                    totalAmount: calculatedTotalAmount,
                    items: {
                        create: transactionItemsData,
                    },
                },
            })

            // 2. Reduce Inventory
            for (const item of transactionItemsData) {
                await tx.inventory.update({
                    where: {
                        userId_eggTypeId: {
                            userId: session.id,
                            eggTypeId: item.eggTypeId,
                        },
                    },
                    data: {
                        goodEggs: { decrement: item.quantityEggs },
                    },
                })
            }

            return transaction
        })

        return NextResponse.json(result)

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
