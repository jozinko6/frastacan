import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

/**
 * Hashes a password with bcrypt (cost factor 12) for the seed script.
 *
 * Uses bcrypt.hashSync so existing call sites that do
 *   `password: hashPassword('admin123')`
 * keep working unchanged. The runtime auth code (src/lib/auth.ts) uses
 * the async `bcrypt.hash` variant for the live API — both produce
 * `$2a$`-prefixed hashes that are interchangeable.
 *
 * Cost factor 12 ≈ ~250ms per hash on a typical laptop. The seed file
 * only runs on `bun run db:seed`, so the extra cost is fine and
 * significantly raises the bar against offline brute force if the
 * SQLite file ever leaks.
 */
const BCRYPT_COST = 12
function hashPassword(password: string): string {
  return bcrypt.hashSync(password, BCRYPT_COST)
}

async function main() {
  console.log('🌱 Seeding database...')

  // ── Users ──────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: 'admin@frastacan.sk' },
    update: {},
    create: {
      email: 'admin@frastacan.sk',
      name: 'Admin Fraštačan',
      password: hashPassword('admin123'),
      phone: '+421900000001',
      role: 'admin',
    },
  })

  // Existing restaurant owners (updated to Hlohovec area)
  const owner1 = await prisma.user.upsert({
    where: { email: 'slovenska@frastacan.sk' },
    update: {},
    create: {
      email: 'slovenska@frastacan.sk',
      name: 'Ján Slovák',
      password: hashPassword('owner123'),
      phone: '+421900000002',
      role: 'restaurant',
    },
  })

  const owner2 = await prisma.user.upsert({
    where: { email: 'talianska@frastacan.sk' },
    update: {},
    create: {
      email: 'talianska@frastacan.sk',
      name: 'Marco Rossi',
      password: hashPassword('owner123'),
      phone: '+421900000003',
      role: 'restaurant',
    },
  })

  const owner3 = await prisma.user.upsert({
    where: { email: 'azska@frastacan.sk' },
    update: {},
    create: {
      email: 'azska@frastacan.sk',
      name: 'Yuki Tanaka',
      password: hashPassword('owner123'),
      phone: '+421900000004',
      role: 'restaurant',
    },
  })

  const owner4 = await prisma.user.upsert({
    where: { email: 'burgeria@frastacan.sk' },
    update: {},
    create: {
      email: 'burgeria@frastacan.sk',
      name: 'Peter Burger',
      password: hashPassword('owner123'),
      phone: '+421900000005',
      role: 'restaurant',
    },
  })

  const owner5 = await prisma.user.upsert({
    where: { email: 'mexicana@frastacan.sk' },
    update: {},
    create: {
      email: 'mexicana@frastacan.sk',
      name: 'Carlos Ramirez',
      password: hashPassword('owner123'),
      phone: '+421900000006',
      role: 'restaurant',
    },
  })

  // New demo restaurant owners
  const ownerPizza = await prisma.user.upsert({
    where: { email: 'pizza@frastacan.sk' },
    update: {},
    create: {
      email: 'pizza@frastacan.sk',
      name: 'Pizza Demo Majiteľ',
      password: hashPassword('owner123'),
      phone: '+421900000020',
      role: 'restaurant',
    },
  })

  const ownerKaviaren = await prisma.user.upsert({
    where: { email: 'kaviaren@frastacan.sk' },
    update: {},
    create: {
      email: 'kaviaren@frastacan.sk',
      name: 'Kaviareň Demo Majiteľ',
      password: hashPassword('owner123'),
      phone: '+421900000021',
      role: 'restaurant',
    },
  })

  const ownerPotraviny = await prisma.user.upsert({
    where: { email: 'potraviny@frastacan.sk' },
    update: {},
    create: {
      email: 'potraviny@frastacan.sk',
      name: 'Potraviny Demo Majiteľ',
      password: hashPassword('owner123'),
      phone: '+421900000022',
      role: 'restaurant',
    },
  })

  const ownerKvety = await prisma.user.upsert({
    where: { email: 'kvety@frastacan.sk' },
    update: {},
    create: {
      email: 'kvety@frastacan.sk',
      name: 'Kvety Demo Majiteľ',
      password: hashPassword('owner123'),
      phone: '+421900000023',
      role: 'restaurant',
    },
  })

  // Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer@test.sk' },
    update: {},
    create: {
      email: 'customer@test.sk',
      name: 'Jozef Novák',
      password: hashPassword('customer123'),
      phone: '+421900000010',
      role: 'customer',
    },
  })

  // Demo riders
  const rider1 = await prisma.user.upsert({
    where: { email: 'rider@frastacan.sk' },
    update: {},
    create: {
      email: 'rider@frastacan.sk',
      name: 'Demo Kuriér Hlohovec',
      password: hashPassword('rider123'),
      phone: '+421900000011',
      role: 'rider',
    },
  })

  const rider2 = await prisma.user.upsert({
    where: { email: 'rider-okolie@frastacan.sk' },
    update: {},
    create: {
      email: 'rider-okolie@frastacan.sk',
      name: 'Demo Kuriér Okolie',
      password: hashPassword('rider123'),
      phone: '+421900000012',
      role: 'rider',
    },
  })

  // ── Delivery Zones ─────────────────────────────────────────────────────

  const zoneHlohovec = await prisma.deliveryZone.create({
    data: {
      name: 'Hlohovec centrum',
      type: 'municipal',
      baseFee: 1.90,
      minimumOrder: 6.00,
      estimatedMin: 25,
      estimatedMax: 45,
      radiusKm: 3,
      centerLat: 48.4317,
      centerLng: 17.8031,
      isActive: true,
    },
  })

  const zoneSulekovo = await prisma.deliveryZone.create({
    data: {
      name: 'Šulekovo',
      type: 'suburban',
      baseFee: 2.40,
      minimumOrder: 8.00,
      estimatedMin: 30,
      estimatedMax: 50,
      radiusKm: 3,
      centerLat: 48.4215,
      centerLng: 17.7900,
      isActive: true,
    },
  })

  const zoneLeopoldov = await prisma.deliveryZone.create({
    data: {
      name: 'Leopoldov',
      type: 'suburban',
      baseFee: 2.90,
      minimumOrder: 10.00,
      estimatedMin: 35,
      estimatedMax: 60,
      radiusKm: 5,
      centerLat: 48.4456,
      centerLng: 17.7647,
      isActive: true,
    },
  })

  const zoneCervenik = await prisma.deliveryZone.create({
    data: {
      name: 'Červeník',
      type: 'village',
      baseFee: 3.50,
      minimumOrder: 12.00,
      estimatedMin: 40,
      estimatedMax: 70,
      radiusKm: 6,
      centerLat: 48.4586,
      centerLng: 17.7996,
      isActive: true,
    },
  })

  // ── Rider Profiles ────────────────────────────────────────────────────

  await prisma.riderProfile.upsert({
    where: { userId: rider1.id },
    update: {},
    create: {
      userId: rider1.id,
      isAvailable: true,
      currentLat: 48.4317,
      currentLng: 17.8031,
      vehicleType: 'bicycle',
      totalDeliveries: 47,
      totalEarnings: 285.50,
      walletBalance: 112.30,
      rating: 4.6,
      reviewCount: 35,
    },
  })

  await prisma.riderProfile.upsert({
    where: { userId: rider2.id },
    update: {},
    create: {
      userId: rider2.id,
      isAvailable: true,
      currentLat: 48.4456,
      currentLng: 17.7647,
      vehicleType: 'car',
      totalDeliveries: 92,
      totalEarnings: 520.00,
      walletBalance: 198.50,
      rating: 4.8,
      reviewCount: 67,
    },
  })

  // ── Demo Restaurants (Fraštačan) ──────────────────────────────────────

  const demoPizza = await prisma.restaurant.create({
    data: {
      name: 'Fraštačan Pizza Demo',
      slug: 'frastacan-pizza-demo',
      description: 'Najlepšia pizza v Hlohovci a okolí. Pečieme v tradičnej peci z čerstvých surovín.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
      logo: '🍕',
      address: 'Námestie sv. Michala 5, 920 01 Hlohovec',
      city: 'Hlohovec',
      phone: '+421905123456',
      email: 'pizza@frastacan.sk',
      cuisine: 'Pizza',
      rating: 4.6,
      reviewCount: 89,
      deliveryTime: '25-45 min',
      minimumOrder: 6.00,
      deliveryFee: 1.90,
      deliveryType: 'delivery',
      openingHours: '{"mon":"10:00-22:00","tue":"10:00-22:00","wed":"10:00-22:00","thu":"10:00-22:00","fri":"10:00-23:00","sat":"11:00-23:00","sun":"11:00-21:00"}',
      isActive: true,
      isAvailable: true,
      ownerId: ownerPizza.id,
      zoneId: zoneHlohovec.id,
    },
  })

  const demoKaviaren = await prisma.restaurant.create({
    data: {
      name: 'Fraštačan Kaviareň Demo',
      slug: 'frastacan-kaviaren-demo',
      description: 'Útulná kaviareň v centre Hlohovca. Výborná káva, domáce dezerty a príjemná atmosféra.',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800',
      logo: '☕',
      address: 'Štúrova 18, 920 01 Hlohovec',
      city: 'Hlohovec',
      phone: '+421905654321',
      email: 'kaviaren@frastacan.sk',
      cuisine: 'Kaviarne',
      rating: 4.8,
      reviewCount: 56,
      deliveryTime: '15-30 min',
      minimumOrder: 4.00,
      deliveryFee: 1.90,
      deliveryType: 'both',
      openingHours: '{"mon":"07:00-19:00","tue":"07:00-19:00","wed":"07:00-19:00","thu":"07:00-19:00","fri":"07:00-20:00","sat":"08:00-20:00","sun":"08:00-18:00"}',
      isActive: true,
      isAvailable: true,
      ownerId: ownerKaviaren.id,
      zoneId: zoneHlohovec.id,
    },
  })

  const demoPotraviny = await prisma.restaurant.create({
    data: {
      name: 'Fraštačan Potraviny Demo',
      slug: 'frastacan-potraviny-demo',
      description: 'Rýchle dodanie čerstvých potravín do vášho domova. Chlieb, mlieko, maslo a ďalšie každodenné potreby.',
      image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800',
      logo: '🛒',
      address: 'Hlavná 32, 920 01 Leopoldov',
      city: 'Leopoldov',
      phone: '+421905789012',
      email: 'potraviny@frastacan.sk',
      cuisine: 'Potraviny',
      rating: 4.3,
      reviewCount: 34,
      deliveryTime: '35-60 min',
      minimumOrder: 10.00,
      deliveryFee: 2.90,
      deliveryType: 'delivery',
      openingHours: '{"mon":"06:00-20:00","tue":"06:00-20:00","wed":"06:00-20:00","thu":"06:00-20:00","fri":"06:00-20:00","sat":"07:00-18:00","sun":"07:00-14:00"}',
      isActive: true,
      isAvailable: true,
      ownerId: ownerPotraviny.id,
      zoneId: zoneLeopoldov.id,
    },
  })

  const demoKvety = await prisma.restaurant.create({
    data: {
      name: 'Fraštačan Kvety Demo',
      slug: 'frastacan-kvety-demo',
      description: 'Krásne kytice a kvetinové dekorácie pre každú príležitosť. Doručujeme po okolí s láskou.',
      image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800',
      logo: '💐',
      address: 'Hlavná 7, 920 01 Červeník',
      city: 'Červeník',
      phone: '+421905345678',
      email: 'kvety@frastacan.sk',
      cuisine: 'Kvety',
      rating: 4.9,
      reviewCount: 21,
      deliveryTime: '40-70 min',
      minimumOrder: 12.00,
      deliveryFee: 3.50,
      deliveryType: 'delivery',
      openingHours: '{"mon":"08:00-17:00","tue":"08:00-17:00","wed":"08:00-17:00","thu":"08:00-17:00","fri":"08:00-17:00","sat":"08:00-14:00","sun":"closed"}',
      isActive: true,
      isAvailable: true,
      ownerId: ownerKvety.id,
      zoneId: zoneCervenik.id,
    },
  })

  // ── Existing Restaurants (updated to Hlohovec area) ───────────────────

  const restaurants = await Promise.all([
    prisma.restaurant.create({
      data: {
        name: 'Slovenská Koliba',
        slug: 'slovenska-koliba',
        description: 'Tradičná slovenská kuchyňa s domácou atmosférou. Bryndzové halušky, kapustnica, vyprážaný syr a ďalšie slovenské špeciality pripravené z čerstvých miestnych surovín.',
        image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
        logo: '🇸🇰',
        address: 'Námestie sv. Michala 15, 920 01 Hlohovec',
        city: 'Hlohovec',
        phone: '+421905123456',
        email: 'info@slovenska-koliba.sk',
        cuisine: 'Slovenská',
        rating: 4.7,
        reviewCount: 234,
        deliveryTime: '25-40 min',
        minimumOrder: 8,
        deliveryFee: 1.90,
        deliveryType: 'both',
        openingHours: '{"mon":"10:00-21:00","tue":"10:00-21:00","wed":"10:00-21:00","thu":"10:00-21:00","fri":"10:00-22:00","sat":"11:00-22:00","sun":"11:00-20:00"}',
        isActive: true,
        isAvailable: true,
        ownerId: owner1.id,
        zoneId: zoneHlohovec.id,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Pizzeria Roma',
        slug: 'pizzeria-roma',
        description: 'Autentická talianska pizza z drevenej pece a čerstvé cestoviny. Naše ingredience dovážame priamo z Talianska pre dokonalý chuťový zážitok.',
        image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
        logo: '🍕',
        address: 'Štúrova 42, 920 01 Hlohovec',
        city: 'Hlohovec',
        phone: '+421905654321',
        email: 'info@pizzeria-roma.sk',
        cuisine: 'Talianska',
        rating: 4.5,
        reviewCount: 189,
        deliveryTime: '30-45 min',
        minimumOrder: 10,
        deliveryFee: 1.90,
        deliveryType: 'delivery',
        openingHours: '{"mon":"11:00-22:00","tue":"11:00-22:00","wed":"11:00-22:00","thu":"11:00-22:00","fri":"11:00-23:00","sat":"12:00-23:00","sun":"12:00-21:00"}',
        isActive: true,
        isAvailable: true,
        ownerId: owner2.id,
        zoneId: zoneHlohovec.id,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Sushi Master',
        slug: 'sushi-master',
        description: 'Japonské špeciality - sushi, sashimi, ramen a ďalšie tradičné jedlá. Čerstvé ryby dodávané denne pre najvyššiu kvalitu.',
        image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
        logo: '🍣',
        address: 'Mlynská 8, 920 01 Hlohovec',
        city: 'Hlohovec',
        phone: '+421905789012',
        email: 'info@sushi-master.sk',
        cuisine: 'Japonská',
        rating: 4.8,
        reviewCount: 156,
        deliveryTime: '35-50 min',
        minimumOrder: 12,
        deliveryFee: 2.40,
        deliveryType: 'delivery',
        openingHours: '{"mon":"11:00-21:00","tue":"11:00-21:00","wed":"11:00-21:00","thu":"11:00-21:00","fri":"11:00-22:00","sat":"12:00-22:00","sun":"12:00-20:00"}',
        isActive: true,
        isAvailable: true,
        ownerId: owner3.id,
        zoneId: zoneSulekovo.id,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'Burger House',
        slug: 'burger-house',
        description: 'Šťavnaté burgery z hovädzieho mäsa, domáce hranolky a craftové limonády. Každý burger pripravujeme z čerstvého mäsa miestnych farmárov.',
        image: 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=800',
        logo: '🍔',
        address: 'Námestie sv. Michala 3, 920 01 Hlohovec',
        city: 'Hlohovec',
        phone: '+421905345678',
        email: 'info@burger-house.sk',
        cuisine: 'Americká',
        rating: 4.3,
        reviewCount: 312,
        deliveryTime: '20-35 min',
        minimumOrder: 6,
        deliveryFee: 1.90,
        deliveryType: 'both',
        openingHours: '{"mon":"10:00-22:00","tue":"10:00-22:00","wed":"10:00-22:00","thu":"10:00-22:00","fri":"10:00-23:00","sat":"11:00-23:00","sun":"11:00-21:00"}',
        isActive: true,
        isAvailable: true,
        ownerId: owner4.id,
        zoneId: zoneHlohovec.id,
      },
    }),
    prisma.restaurant.create({
      data: {
        name: 'El Taco Loco',
        slug: 'el-taco-loco',
        description: 'Mexické tacos, burritos, nachos a ďalšie pikantné špeciality. Ostré omáčky a čerstvé guacamole pripravené pred vašimi očami.',
        image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?w=800',
        logo: '🌮',
        address: 'Alžbetina 22, 920 01 Hlohovec',
        city: 'Hlohovec',
        phone: '+421905987654',
        email: 'info@el-taco-loco.sk',
        cuisine: 'Mexická',
        rating: 4.4,
        reviewCount: 98,
        deliveryTime: '25-40 min',
        minimumOrder: 8,
        deliveryFee: 2.40,
        deliveryType: 'delivery',
        openingHours: '{"mon":"11:00-21:00","tue":"11:00-21:00","wed":"11:00-21:00","thu":"11:00-21:00","fri":"11:00-22:00","sat":"12:00-22:00","sun":"12:00-20:00"}',
        isActive: true,
        isAvailable: true,
        ownerId: owner5.id,
        zoneId: zoneSulekovo.id,
      },
    }),
  ])

  // ── Categories & Food Items for Demo Restaurants ──────────────────────

  // Fraštačan Pizza Demo
  const dPizzaCat = await prisma.category.create({ data: { name: 'Pizza', icon: '🍕', restaurantId: demoPizza.id, sortOrder: 1 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Margherita', description: 'Klasická pizza s paradajkovým základom, mozzarellou a bazalkou', price: 6.90, categoryId: dPizzaCat.id, restaurantId: demoPizza.id, isPopular: true },
      { name: 'Šunková', description: 'Pizza so šunkou, syrom a paradajkovým základom', price: 7.90, categoryId: dPizzaCat.id, restaurantId: demoPizza.id, isPopular: true },
      { name: 'Salámová', description: 'Pizza s salámou, syrom a bylinkami', price: 8.20, categoryId: dPizzaCat.id, restaurantId: demoPizza.id },
      { name: 'Quattro Formaggi', description: 'Pizza so štyrmi syrmi - mozzarella, gorgonzola, parmezán, stracciatella', price: 8.90, categoryId: dPizzaCat.id, restaurantId: demoPizza.id, isPopular: true },
      { name: 'Gazdovská', description: 'Pizza s bravčovým mäsom, hubami, paprikou a syrom', price: 9.50, categoryId: dPizzaCat.id, restaurantId: demoPizza.id },
    ]
  })

  // Fraštačan Kaviareň Demo
  const dKavKava = await prisma.category.create({ data: { name: 'Káva', icon: '☕', restaurantId: demoKaviaren.id, sortOrder: 1 } })
  const dKavDezert = await prisma.category.create({ data: { name: 'Dezerty', icon: '🍰', restaurantId: demoKaviaren.id, sortOrder: 2 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Espresso', description: 'Jeden shot výbornej talianskej kávy', price: 1.80, categoryId: dKavKava.id, restaurantId: demoKaviaren.id, isPopular: true },
      { name: 'Cappuccino', description: 'Espresso s krémovou penou z mlieka', price: 2.40, categoryId: dKavKava.id, restaurantId: demoKaviaren.id, isPopular: true },
      { name: 'Latte', description: 'Espresso s veľkým množstvom ohriateho mlieka', price: 2.80, categoryId: dKavKava.id, restaurantId: demoKaviaren.id },
      { name: 'Cheesecake', description: 'Krémový cheesecake s ovocným toppingom', price: 3.20, categoryId: dKavDezert.id, restaurantId: demoKaviaren.id, isPopular: true },
      { name: 'Croissant', description: 'Chrumkavý francúzsky croissant s maslom', price: 2.20, categoryId: dKavDezert.id, restaurantId: demoKaviaren.id },
    ]
  })

  // Fraštačan Potraviny Demo
  const dPotPečivo = await prisma.category.create({ data: { name: 'Pečivo', icon: '🍞', restaurantId: demoPotraviny.id, sortOrder: 1 } })
  const dPotMliečne = await prisma.category.create({ data: { name: 'Mliečne', icon: '🥛', restaurantId: demoPotraviny.id, sortOrder: 2 } })
  const dPotNapoje = await prisma.category.create({ data: { name: 'Nápoje', icon: '💧', restaurantId: demoPotraviny.id, sortOrder: 3 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Chlieb', description: 'Čerstvý biely chlieb', price: 1.80, categoryId: dPotPečivo.id, restaurantId: demoPotraviny.id, isPopular: true },
      { name: 'Rožok', description: 'Čerstvý rožok', price: 0.15, categoryId: dPotPečivo.id, restaurantId: demoPotraviny.id },
      { name: 'Mlieko 1l', description: 'Čerstvé plnotučné mlieko', price: 1.20, categoryId: dPotMliečne.id, restaurantId: demoPotraviny.id, isPopular: true },
      { name: 'Maslo', description: 'Maslo 250g', price: 2.40, categoryId: dPotMliečne.id, restaurantId: demoPotraviny.id },
      { name: 'Minerálka', description: 'Minerálna voda 1.5l', price: 0.90, categoryId: dPotNapoje.id, restaurantId: demoPotraviny.id },
    ]
  })

  // Fraštačan Kvety Demo
  const dKvetyKytice = await prisma.category.create({ data: { name: 'Kytice', icon: '💐', restaurantId: demoKvety.id, sortOrder: 1 } })
  const dKvetyDoplnky = await prisma.category.create({ data: { name: 'Doplnky', icon: '🎁', restaurantId: demoKvety.id, sortOrder: 2 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Kytica malá', description: 'Malá kytica sezónnych kvetov', price: 15.00, categoryId: dKvetyKytice.id, restaurantId: demoKvety.id, isPopular: true },
      { name: 'Kytica stredná', description: 'Stredná kytica s rozmanitými kvetmi', price: 25.00, categoryId: dKvetyKytice.id, restaurantId: demoKvety.id, isPopular: true },
      { name: 'Kytica veľká', description: 'Veľkolepá kytica pre špeciálne príležitosti', price: 39.00, categoryId: dKvetyKytice.id, restaurantId: demoKvety.id },
      { name: 'Ruža', description: 'Jedná červená ruža', price: 3.50, categoryId: dKvetyDoplnky.id, restaurantId: demoKvety.id },
      { name: 'Blahoželanie', description: 'Pridanie blahoželacej kartičky k objednávke', price: 1.50, categoryId: dKvetyDoplnky.id, restaurantId: demoKvety.id },
    ]
  })

  // ── Categories & Food Items for Existing Restaurants ──────────────────

  // Slovenská Koliba
  const sk = restaurants[0]
  const skPolievky = await prisma.category.create({ data: { name: 'Polievky', icon: '🍲', restaurantId: sk.id, sortOrder: 1 } })
  const skHlavne = await prisma.category.create({ data: { name: 'Hlavné jedlá', icon: '🍖', restaurantId: sk.id, sortOrder: 2 } })
  const skPrilohy = await prisma.category.create({ data: { name: 'Prílohy', icon: '🥔', restaurantId: sk.id, sortOrder: 3 } })
  const skDeserty = await prisma.category.create({ data: { name: 'Dezerty', icon: '🍰', restaurantId: sk.id, sortOrder: 4 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Kapustnica', description: 'Tradičná slovenská kapustnica s údeným mäsom a klobásou', price: 4.5, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', categoryId: skPolievky.id, restaurantId: sk.id, isPopular: true },
      { name: 'Hríbová polievka', description: 'Krémová polievka z čerstvých lesných hríbov', price: 3.9, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400', categoryId: skPolievky.id, restaurantId: sk.id },
      { name: 'Bryndzové halušky', description: 'Klasické bryndzové halušky s hrubou balkánskou bryndzou a slaninkou', price: 7.9, image: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=400', categoryId: skHlavne.id, restaurantId: sk.id, isPopular: true },
      { name: 'Vyprážaný syr', description: 'Vyprážaný syr eidam s tatárskou omáčkou a hranolkami', price: 6.5, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=400', categoryId: skHlavne.id, restaurantId: sk.id, isPopular: true },
      { name: 'Sviečková na smotane', description: 'Sviečková na smotane s knedľou a brusnicami', price: 9.9, image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400', categoryId: skHlavne.id, restaurantId: sk.id },
      { name: 'Guláš', description: 'Maďarský hovädzí guláš s chlebom', price: 8.5, image: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=400', categoryId: skHlavne.id, restaurantId: sk.id },
      { name: 'Zemiakové placky', description: 'Chrumkavé zemiakové placky s kyslou smotanou', price: 4.9, image: 'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?w=400', categoryId: skPrilohy.id, restaurantId: sk.id },
      { name: 'Pirohy', description: 'Pirohy s bryndzou a slaninkou', price: 6.9, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', categoryId: skHlavne.id, restaurantId: sk.id },
      { name: 'Štrúdľa', description: 'Jablková štrúdľa s vanilkovou omáčkou', price: 4.5, image: 'https://images.unsplash.com/photo-1559598467-f8b76c8155d0?w=400', categoryId: skDeserty.id, restaurantId: sk.id, isPopular: true },
      { name: 'Palacinky', description: 'Palacinky s lekvárom a tvarohom', price: 3.9, image: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400', categoryId: skDeserty.id, restaurantId: sk.id },
    ]
  })

  // Pizzeria Roma
  const pr = restaurants[1]
  const prPizza = await prisma.category.create({ data: { name: 'Pizza', icon: '🍕', restaurantId: pr.id, sortOrder: 1 } })
  const prCestoviny = await prisma.category.create({ data: { name: 'Cestoviny', icon: '🍝', restaurantId: pr.id, sortOrder: 2 } })
  const prSalaty = await prisma.category.create({ data: { name: 'Šaláty', icon: '🥗', restaurantId: pr.id, sortOrder: 3 } })
  const prDesertyIt = await prisma.category.create({ data: { name: 'Dezerty', icon: '🍨', restaurantId: pr.id, sortOrder: 4 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Margherita', description: 'Klasická pizza s paradajkovým základom, mozzarellou a bazalkou', price: 8.9, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400', categoryId: prPizza.id, restaurantId: pr.id, isPopular: true },
      { name: 'Quattro Formaggi', description: 'Pizza so štyrmi syrmi - mozzarella, gorgonzola, parmezán, stracciatella', price: 11.9, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400', categoryId: prPizza.id, restaurantId: pr.id, isPopular: true },
      { name: 'Prosciutto e Funghi', description: 'Pizza so šunkou, hubami a mozzarellou', price: 10.9, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', categoryId: prPizza.id, restaurantId: pr.id },
      { name: 'Diavola', description: 'Pikantná pizza so salámi pepperoni a čili', price: 10.5, image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=400', categoryId: prPizza.id, restaurantId: pr.id },
      { name: 'Carbonara', description: 'Špagety carbonara s guanciale, vajíčkom a parmezánom', price: 9.9, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400', categoryId: prCestoviny.id, restaurantId: pr.id, isPopular: true },
      { name: 'Bolognese', description: 'Špagety s bohatou mäsovou omáčkou z hovädzieho mäsa', price: 8.9, image: 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=400', categoryId: prCestoviny.id, restaurantId: pr.id },
      { name: 'Pesto Genovese', description: 'Penne s bazalkovým pestom, píniovými orieškami a parmezánom', price: 9.5, image: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400', categoryId: prCestoviny.id, restaurantId: pr.id },
      { name: 'Caesar šalát', description: 'Rímsky šalát s grilovaným kuracím mäsom, krutónmi a parmezánom', price: 8.5, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', categoryId: prSalaty.id, restaurantId: pr.id },
      { name: 'Tiramisu', description: 'Tradičné talianske tiramisu s kávou a mascarpone', price: 5.5, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400', categoryId: prDesertyIt.id, restaurantId: pr.id, isPopular: true },
      { name: 'Panna Cotta', description: 'Krémová panna cotta s lesným ovocím', price: 4.9, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', categoryId: prDesertyIt.id, restaurantId: pr.id },
    ]
  })

  // Sushi Master
  const sm = restaurants[2]
  const smSushi = await prisma.category.create({ data: { name: 'Sushi sety', icon: '🍣', restaurantId: sm.id, sortOrder: 1 } })
  const smRamen = await prisma.category.create({ data: { name: 'Ramen', icon: '🍜', restaurantId: sm.id, sortOrder: 2 } })
  const smStarter = await prisma.category.create({ data: { name: 'Predjedlá', icon: '🥟', restaurantId: sm.id, sortOrder: 3 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Sushi set Premium', description: '24 ks rôznych sushi - nigiri, maki, sashimi', price: 24.9, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400', categoryId: smSushi.id, restaurantId: sm.id, isPopular: true },
      { name: 'Sushi set Classic', description: '16 ks sushi - nigiri a maki rolls', price: 16.9, image: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400', categoryId: smSushi.id, restaurantId: sm.id },
      { name: 'Dragon Roll', description: 'Veľký inside-out roll s avokádom, uhorkou a tuniakom', price: 12.9, image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400', categoryId: smSushi.id, restaurantId: sm.id, isPopular: true },
      { name: 'California Roll', description: 'Krabí stick, avokádo, uhorka a sezam', price: 9.9, image: 'https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400', categoryId: smSushi.id, restaurantId: sm.id },
      { name: 'Miso Ramen', description: 'Jedlá miso polievka s rezancami, vajíčkom, chashu a zeleninou', price: 11.9, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', categoryId: smRamen.id, restaurantId: sm.id, isPopular: true },
      { name: 'Tonkotsu Ramen', description: 'Krémová bravčová polievka s rezancami a chashu', price: 12.9, image: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?w=400', categoryId: smRamen.id, restaurantId: sm.id },
      { name: 'Edamame', description: 'Mladé sójové bôby so soľou', price: 4.5, image: 'https://images.unsplash.com/photo-1564834744159-ff0ea41ba4b9?w=400', categoryId: smStarter.id, restaurantId: sm.id },
      { name: 'Gyoza', description: 'Vyprážané japonské dumplings s bravčovým mäsom', price: 7.9, image: 'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400', categoryId: smStarter.id, restaurantId: sm.id },
    ]
  })

  // Burger House
  const bh = restaurants[3]
  const bhBurgers = await prisma.category.create({ data: { name: 'Burgery', icon: '🍔', restaurantId: bh.id, sortOrder: 1 } })
  const bhPrilohy = await prisma.category.create({ data: { name: 'Prílohy', icon: '🍟', restaurantId: bh.id, sortOrder: 2 } })
  const bhNapoj = await prisma.category.create({ data: { name: 'Nápoje', icon: '🥤', restaurantId: bh.id, sortOrder: 3 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Classic Burger', description: '150g hovädzí burger, šalát, paradajka, cibuľa, domáca omáčka', price: 7.9, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', categoryId: bhBurgers.id, restaurantId: bh.id, isPopular: true },
      { name: 'Cheese Burger', description: '150g hovädzí burger s cheddarem, slaninkou a BBQ omáčkou', price: 9.5, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400', categoryId: bhBurgers.id, restaurantId: bh.id, isPopular: true },
      { name: 'Double Trouble', description: 'Dvojitý 300g burger s dvojitým syrom a karamelizovanou cibuľou', price: 13.9, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400', categoryId: bhBurgers.id, restaurantId: bh.id },
      { name: 'Chicken Burger', description: 'Chrumkavý kurací burger s cesnakovým dresingom', price: 8.5, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', categoryId: bhBurgers.id, restaurantId: bh.id },
      { name: 'Veggie Burger', description: 'Burger z čiernej fazule s avokádom a rukolou', price: 8.9, image: 'https://images.unsplash.com/photo-1520072959219-c595e6cdc07e?w=400', categoryId: bhBurgers.id, restaurantId: bh.id },
      { name: 'Hranolky', description: 'Domáce hranolky z čerstvých zemiakov', price: 3.5, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400', categoryId: bhPrilohy.id, restaurantId: bh.id, isPopular: true },
      { name: 'Cibuľové krúžky', description: 'Chrumkavé cibuľové krúžky s BBQ omáčkou', price: 4.5, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400', categoryId: bhPrilohy.id, restaurantId: bh.id },
      { name: 'Craft limonáda', description: 'Domáca limonáda z čerstvého ovocia - citrón, limetka, malina', price: 3.9, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', categoryId: bhNapoj.id, restaurantId: bh.id },
    ]
  })

  // El Taco Loco
  const etl = restaurants[4]
  const etlTacos = await prisma.category.create({ data: { name: 'Tacos', icon: '🌮', restaurantId: etl.id, sortOrder: 1 } })
  const etlBurritos = await prisma.category.create({ data: { name: 'Burritos & Bowls', icon: '🌯', restaurantId: etl.id, sortOrder: 2 } })
  const etlPredjedla = await prisma.category.create({ data: { name: 'Predjedlá', icon: '🥑', restaurantId: etl.id, sortOrder: 3 } })

  await prisma.foodItem.createMany({
    data: [
      { name: 'Tacos Al Pastor', description: '3 kusy tacos s bravčovým mäsom, ananásom a koriandrom', price: 8.9, image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', categoryId: etlTacos.id, restaurantId: etl.id, isPopular: true },
      { name: 'Tacos Carnitas', description: '3 kusy tacos s pomaly pečeným bravčovým mäsom a salsou', price: 8.5, image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400', categoryId: etlTacos.id, restaurantId: etl.id },
      { name: 'Tacos Pollo', description: '3 kusy tacos s grilovaným kuracím mäsom a guacamole', price: 7.9, image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', categoryId: etlTacos.id, restaurantId: etl.id },
      { name: 'Burrito Supreme', description: 'Veľký burrito s mäsom, ryžou, fazuľou, syrom a salsou', price: 10.9, image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', categoryId: etlBurritos.id, restaurantId: etl.id, isPopular: true },
      { name: 'Buddha Bowl', description: 'Mexická miska s ryžou, fazuľou, avokádom, kukuricou a salsou', price: 9.9, image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', categoryId: etlBurritos.id, restaurantId: etl.id },
      { name: 'Nachos Grande', description: 'Chrumkavé nachos so syrom, jalapeños, salsou a kyslou smotanou', price: 7.5, image: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400', categoryId: etlPredjedla.id, restaurantId: etl.id, isPopular: true },
      { name: 'Guacamole & Chips', description: 'Čerstvé guacamole z avokáda s domácimi kukuričnými chipsami', price: 6.5, image: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400', categoryId: etlPredjedla.id, restaurantId: etl.id },
    ]
  })

  // ── Customer Addresses (Hlohovec area) ────────────────────────────────

  await prisma.address.createMany({
    data: [
      { label: 'Domov', street: 'Námestie sv. Michala 25', city: 'Hlohovec', postalCode: '920 01', lat: 48.4317, lng: 17.8031, isDefault: true, userId: customer.id },
      { label: 'Práca', street: 'Štúrova 48', city: 'Hlohovec', postalCode: '920 01', lat: 48.4325, lng: 17.8005, userId: customer.id },
    ]
  })

  // ── Demo Orders (Hlohovec area) ──────────────────────────────────────

  const halusky = await prisma.foodItem.findFirst({ where: { name: 'Bryndzové halušky', restaurantId: sk.id } })
  const kapustnica = await prisma.foodItem.findFirst({ where: { name: 'Kapustnica', restaurantId: sk.id } })
  const strudla = await prisma.foodItem.findFirst({ where: { name: 'Štrúdľa', restaurantId: sk.id } })

  const order1 = await prisma.order.create({
    data: {
      orderNumber: 'FR-001',
      status: 'delivered',
      paymentMethod: 'card',
      paymentStatus: 'paid',
      subtotal: 15.8,
      deliveryFee: 1.90,
      discount: 0,
      total: 17.70,
      deliveryType: 'delivery',
      city: 'Hlohovec',
      deliveryAddress: 'Námestie sv. Michala 25, Hlohovec',
      deliveryLat: 48.4317,
      deliveryLng: 17.8031,
      estimatedTime: '25-40 min',
      customerId: customer.id,
      restaurantId: sk.id,
      riderId: rider1.id,
      confirmedAt: new Date(Date.now() - 86400000 * 2),
      preparedAt: new Date(Date.now() - 86400000 * 2 + 1200000),
      deliveredAt: new Date(Date.now() - 86400000 * 2 + 3600000),
    }
  })

  if (halusky && kapustnica && strudla) {
    await prisma.orderItem.createMany({
      data: [
        { quantity: 1, price: 7.9, foodItemId: halusky.id, orderId: order1.id },
        { quantity: 1, price: 4.5, foodItemId: kapustnica.id, orderId: order1.id },
        { quantity: 1, price: 3.4, foodItemId: strudla.id, orderId: order1.id },
      ]
    })
  }

  // Review for order 1
  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Výborné halušky, presne ako u babky! Rýchle doručenie.',
      orderId: order1.id,
      customerId: customer.id,
      restaurantId: sk.id,
    }
  })

  // Second order (in progress)
  const pizzaQuattro = await prisma.foodItem.findFirst({ where: { name: 'Quattro Formaggi', restaurantId: pr.id } })
  const pizzaMargheritaPr = await prisma.foodItem.findFirst({ where: { name: 'Margherita', restaurantId: pr.id } })

  const order2 = await prisma.order.create({
    data: {
      orderNumber: 'FR-002',
      status: 'preparing',
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      subtotal: 20.8,
      deliveryFee: 1.90,
      discount: 0,
      total: 22.70,
      deliveryType: 'delivery',
      city: 'Hlohovec',
      deliveryAddress: 'Štúrova 48, Hlohovec',
      deliveryLat: 48.4325,
      deliveryLng: 17.8005,
      estimatedTime: '30-45 min',
      customerId: customer.id,
      restaurantId: pr.id,
      confirmedAt: new Date(),
    }
  })

  if (pizzaQuattro && pizzaMargheritaPr) {
    await prisma.orderItem.createMany({
      data: [
        { quantity: 1, price: 11.9, foodItemId: pizzaQuattro.id, orderId: order2.id },
        { quantity: 1, price: 8.9, foodItemId: pizzaMargheritaPr.id, orderId: order2.id },
      ]
    })
  }

  // ── Coupons ───────────────────────────────────────────────────────────

  await prisma.coupon.createMany({
    data: [
      { code: 'FRASTACAN10', discount: 10, minOrder: 15, maxDiscount: 5, isActive: true },
      { code: 'VITAJ20', discount: 20, minOrder: 20, maxDiscount: 8, isActive: true },
      { code: 'PIZZA15', discount: 15, minOrder: 10, maxDiscount: 4, isActive: true },
    ]
  })

  console.log('✅ Seeding completed!')
  console.log({
    users: await prisma.user.count(),
    deliveryZones: await prisma.deliveryZone.count(),
    restaurants: await prisma.restaurant.count(),
    categories: await prisma.category.count(),
    foodItems: await prisma.foodItem.count(),
    orders: await prisma.order.count(),
    coupons: await prisma.coupon.count(),
  })
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
