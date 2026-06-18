import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } })
  console.log('--- USERS ---')
  console.table(users)
  const restaurants = await prisma.restaurant.findMany({ select: { id: true, slug: true, name: true, ownerId: true } })
  console.log('--- RESTAURANTS ---')
  console.table(restaurants)
  const riderProfiles = await prisma.riderProfile.findMany()
  console.log('--- RIDER PROFILES ---')
  console.table(riderProfiles)
  const orders = await prisma.order.count()
  console.log('Orders count:', orders)
}
main().catch(console.error).finally(() => prisma.$disconnect())
