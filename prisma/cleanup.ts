import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up duplicate Egg Types...')

    // Cleanup EggType duplicates
    await prisma.$executeRaw`
        DELETE FROM "EggType"
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM "EggType"
            GROUP BY name
        );
    `

    // Cleanup User duplicates (Added this to fix the latest deployment error)
    await prisma.$executeRaw`
        DELETE FROM "User"
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM "User"
            GROUP BY name
        );
    `

    console.log('Cleanup completed.')
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
