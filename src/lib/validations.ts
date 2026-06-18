import { z } from 'zod'

/**
 * Input validation schemas (Zod) shared across API routes.
 *
 * Why a central file:
 *  - One place to harden password / email / phone rules.
 *  - All API routes use the same \`validateInput\` helper so error
 *    messages stay consistent (Slovak, user-friendly) and there is no
 *    inline \`if (!field) return 400\` boilerplate that's easy to forget.
 *
 * Security note:
 *  - Password policy: 8–128 chars, at least one letter and one digit.
 *    We don't enforce mixed-case / symbols because we want users to
 *    actually pick memorable passwords — length + uniqueness is what
 *    matters most against bcrypt-protected offline attacks.
 *  - All string fields are trimmed and length-capped so a malicious
 *    client can't store megabyte-long strings in SQLite.
 */

const MAX_NAME_LEN = 100
const MAX_EMAIL_LEN = 254
const MAX_NOTES_LEN = 1000
const MAX_ADDRESS_LEN = 200

/** String that must be a non-empty trimmed string of at most `max` chars. */
function trimmedString(max: number) {
  return z
    .string()
    .trim()
    .min(1, 'Pole je povinné')
    .max(max, `Pole nesmie byť dlhšie ako ${max} znakov`)
}

/** Email — RFC 5322 simplified, lowercased before lookup. */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Email je príliš krátky')
  .max(MAX_EMAIL_LEN, 'Email je príliš dlhý')
  .email('Neplatný formát emailu')

/** Password policy. */
export const passwordSchema = z
  .string()
  .min(8, 'Heslo musí mať aspoň 8 znakov')
  .max(128, 'Heslo nesmie byť dlhšie ako 128 znakov')
  .regex(/[a-zA-Z]/, 'Heslo musí obsahovať aspoň jedno písmeno')
  .regex(/[0-9]/, 'Heslo musí obsahovať aspoň jednu číslicu')

/** Phone — accept +421 / 09xx / international forms, digits + spaces + + - (). */
export const phoneSchema = z
  .string()
  .trim()
  .max(30, 'Telefónne číslo je príliš dlhé')
  .regex(/^[+]?[0-9][0-9\s()-]{5,29}$/, 'Neplatný formát telefónneho čísla')
  .optional()
  .or(z.literal(''))

// ── Auth schemas ─────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Heslo je povinné'),
})

export const registerSchema = z.object({
  name: trimmedString(MAX_NAME_LEN),
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
})

// ── Order schemas ────────────────────────────────────────────────────

export const orderItemInputSchema = z.object({
  foodItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().trim().max(MAX_NOTES_LEN).optional().nullable(),
})

export const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  items: z.array(orderItemInputSchema).min(1, 'Objednávka musí obsahovať aspoň jednu položku').max(50),
  deliveryAddress: z.string().trim().min(1, 'Adresa doručenia je povinná').max(MAX_ADDRESS_LEN),
  paymentMethod: z.enum(['cash', 'card']).default('cash'),
  notes: z.string().trim().max(MAX_NOTES_LEN).optional().nullable(),
  couponCode: z.string().trim().min(1).max(50).optional().nullable(),
})

// ── Address schemas ──────────────────────────────────────────────────

export const createAddressSchema = z.object({
  label: trimmedString(50),
  street: trimmedString(MAX_ADDRESS_LEN),
  city: trimmedString(100),
  postalCode: z
    .string()
    .trim()
    .max(20, 'PSČ je príliš dlhé')
    .optional()
    .or(z.literal('')),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  isDefault: z.boolean().optional(),
})

// ── Review schema ────────────────────────────────────────────────────

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Hodnotenie musí byť aspoň 1').max(5, 'Hodnotenie môže byť najviac 5'),
  comment: z.string().trim().max(1000, 'Komentár je príliš dlhý').optional().nullable(),
  orderId: z.string().min(1),
  restaurantId: z.string().min(1),
})

// ── Coupon schemas ───────────────────────────────────────────────────

export const validateCouponSchema = z.object({
  code: z.string().trim().min(1, 'Kód kupónu je povinný').max(50),
  restaurantId: z.string().min(1).optional(),
  subtotal: z.number().min(0).max(100000).optional(),
})

export const createCouponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Kód kupónu musí mať aspoň 3 znaky')
    .max(50, 'Kód kupónu je príliš dlhý')
    .regex(/^[A-Z0-9_-]+$/i, 'Kód kupónu môže obsahovať iba veľké písmená, číslice, pomlčku a podčiarknik'),
  discount: z.number().min(0, 'Zľava nemôže byť záporná').max(100, 'Zľava nemôže presiahnuť 100 %'),
  minOrder: z.number().min(0).max(100000).optional(),
  maxDiscount: z.number().min(0).max(100000).optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
})

export const updateCouponSchema = z.object({
  couponId: z.string().min(1),
  isActive: z.boolean(),
})

// ── Vendor / restaurant update ───────────────────────────────────────

export const vendorPatchSchema = z
  .object({
    name: trimmedString(MAX_NAME_LEN).optional(),
    description: z.string().trim().max(2000).optional(),
    phone: trimmedString(30).optional(),
    email: emailSchema.optional(),
    address: trimmedString(MAX_ADDRESS_LEN).optional(),
    city: trimmedString(100).optional(),
    openingHours: z.string().trim().max(2000).optional().nullable(),
    deliveryType: z.enum(['delivery', 'pickup', 'both']).optional(),
    cuisine: trimmedString(200).optional(),
    minimumOrder: z.number().min(0).max(100000).optional(),
    deliveryFee: z.number().min(0).max(1000).optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Žiadne údaje na aktualizáciu' })

// ── Vendor menu item ─────────────────────────────────────────────────

export const vendorMenuCreateSchema = z.object({
  name: trimmedString(MAX_NAME_LEN),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.number().min(0, 'Cena nemôže byť záporná').max(100000),
  discountPrice: z.number().min(0).max(100000).optional().nullable(),
  isAvailable: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  categoryId: z.string().min(1),
})

export const vendorMenuPatchSchema = z.object({
  id: z.string().min(1),
  name: trimmedString(MAX_NAME_LEN).optional(),
  description: z.string().trim().max(1000).optional().nullable(),
  price: z.number().min(0).max(100000).optional(),
  discountPrice: z.number().min(0).max(100000).optional().nullable(),
  isAvailable: z.boolean().optional(),
  isPopular: z.boolean().optional(),
  categoryId: z.string().min(1).optional(),
})

// ── Vendor category ──────────────────────────────────────────────────

export const vendorCategoryCreateSchema = z.object({
  name: trimmedString(MAX_NAME_LEN),
  icon: z.string().trim().max(20).optional().nullable(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
})

// ── Admin zone patch ─────────────────────────────────────────────────

export const adminZonePatchSchema = z
  .object({
    zoneId: z.string().min(1),
    name: trimmedString(100).optional(),
    type: z.enum(['municipal', 'suburban', 'village']).optional(),
    baseFee: z.number().min(0).max(1000).optional(),
    minimumOrder: z.number().min(0).max(100000).optional(),
    estimatedMin: z.number().int().min(0).max(600).optional(),
    estimatedMax: z.number().int().min(0).max(600).optional(),
    radiusKm: z.number().min(0).max(200).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 1, { message: 'Žiadne údaje na aktualizáciu' })

// ── Admin user patch ─────────────────────────────────────────────────

export const adminUserPatchSchema = z.object({
  userId: z.string().min(1),
  isActive: z.boolean(),
})

// ── Admin restaurant patch ───────────────────────────────────────────

export const adminRestaurantPatchSchema = z
  .object({
    isActive: z.boolean().optional(),
    isAvailable: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Je potrebné zadať aspoň jedno pole: isActive alebo isAvailable' })

// ── Rider update ─────────────────────────────────────────────────────

export const riderPatchSchema = z
  .object({
    isAvailable: z.boolean().optional(),
    currentLat: z.number().min(-90).max(90).optional(),
    currentLng: z.number().min(-180).max(180).optional(),
    vehicleType: z.enum(['bicycle', 'scooter', 'car', 'foot']).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Žiadne údaje na aktualizáciu' })

// ── Order status update ──────────────────────────────────────────────

export const orderStatusSchema = z.object({
  status: z.enum([
    'pending',
    'confirmed',
    'preparing',
    'ready',
    'picking_up',
    'delivering',
    'delivered',
    'cancelled',
    'refunded',
    'failed',
  ]),
})

// ── Generic helper ───────────────────────────────────────────────────

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string }

export function validateInput<T>(
  schema: z.ZodType<T>,
  input: unknown
): ValidationResult<T> {
  const result = schema.safeParse(input)
  if (result.success) {
    return { ok: true, value: result.data }
  }
  // Collect all error messages, prefer the first issue for the user.
  const firstIssue = result.error.issues[0]
  const message = firstIssue?.message || 'Neplatné údaje'
  return { ok: false, error: message }
}
