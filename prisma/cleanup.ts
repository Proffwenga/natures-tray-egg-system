import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Cleaning up duplicate Egg Types...')

    // Using raw SQL to ensure it works even if the schema is in a transitional state
    // This SQL deletes all but the first entry for each egg type name
    await prisma.$executeRaw`
        DELETE FROM "EggType"
        WHERE id NOT IN (
            SELECT MIN(id)
            FROM "EggType"
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
