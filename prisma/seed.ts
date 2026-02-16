import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // 1. Create Egg Types
    const eggTypes = [
        { name: 'Jumbo', priceTrayWholesale: 450.0, priceUnitRetail: 20.0 },
        { name: 'Normal', priceTrayWholesale: 420.0, priceUnitRetail: 18.0 },
        { name: 'Pullets', priceTrayWholesale: 380.0, priceUnitRetail: 15.0 },
    ]

    console.log('Seeding Egg Types...')
    for (const type of eggTypes) {
        await prisma.eggType.upsert({
            where: { name: type.name },
            update: {
                priceTrayWholesale: type.priceTrayWholesale,
                priceUnitRetail: type.priceUnitRetail,
            },
            create: type,
        })
    }

    // 2. Create Users
    const defaultHash = await bcrypt.hash('password123', 10)
    const naphtaliHash = await bcrypt.hash('nttpass123', 10)
    const alfredHash = await bcrypt.hash('natpass123', 10)

    const users = [
        { name: 'admin', role: 'ADMIN', passwordHash: defaultHash },
        { name: 'manager', role: 'MANAGER', passwordHash: defaultHash },
        { name: 'sales', role: 'SALES_PERSON', passwordHash: defaultHash },
        { name: 'Naphtali', role: 'SALES_PERSON', passwordHash: naphtaliHash },
        { name: 'Alfred', role: 'SALES_PERSON', passwordHash: alfredHash },
    ]

    console.log('Seeding Users...')
    for (const user of users) {
        await prisma.user.upsert({
            where: { name: user.name },
            update: {
                role: user.role,
                passwordHash: user.passwordHash,
            },
            create: user,
        })
    }

    console.log('Seeding completed.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
