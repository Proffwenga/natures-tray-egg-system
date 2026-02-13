import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const session = await getSession()
    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')

    const where = role ? { role: role.toUpperCase() } : {}

    const users = await prisma.user.findMany({
        where,
        select: { id: true, name: true, role: true }
    })

    return NextResponse.json({ users })
}
