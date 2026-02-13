import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const CustomerSchema = z.object({
    name: z.string().min(1),
    phoneNumber: z.string().optional(),
})

export async function GET() {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' },
    })

    return NextResponse.json({ customers })
}

export async function POST(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()
        const { name, phoneNumber } = CustomerSchema.parse(body)

        const customer = await prisma.customer.create({
            data: {
                name,
                phoneNumber,
            },
        })

        return NextResponse.json(customer)
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
