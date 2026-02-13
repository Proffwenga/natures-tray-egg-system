import { prisma } from '@/lib/db'
import { encrypt } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const LoginSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(1, 'Password is required'),
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, password } = LoginSchema.parse(body)

        const user = await prisma.user.findFirst({
            where: { name },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        const isValid = await bcrypt.compare(password, user.passwordHash)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Create session
        const session = await encrypt({ id: user.id, name: user.name, role: user.role })

        // Set cookie
        const cookieStore = await cookies()
        cookieStore.set('session', session, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        })

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
            },
        })
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
