/**
 * Drizzle seed script — populates the database with demo data.
 * Run: pnpm --filter @workspace/scripts run seed
 *
 * Users:
 *   buyer@kunda.gm  / Test1234!
 *   seller@kunda.gm / Test1234!
 *   admin@kunda.gm  / Admin1234!
 */
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as schema from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

async function main() {
  console.log("🌱 Seeding database…");

  // ── Users ──────────────────────────────────────────────────────────────────
  const userDefs = [
    { email: "buyer@kunda.gm",  password: "Test1234!",  role: "BUYER"  as const, firstName: "Aminata", lastName: "Jallow",   country: "GB" },
    { email: "seller@kunda.gm", password: "Test1234!",  role: "SELLER" as const, firstName: "Ousman",  lastName: "Ceesay",   country: "GM" },
    { email: "admin@kunda.gm",  password: "Admin1234!", role: "ADMIN"  as const, firstName: "Fatou",   lastName: "Touray",   country: "GM" },
  ];

  const createdUsers: Record<string, schema.User> = {};

  for (const u of userDefs) {
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, u.email)).limit(1);
    if (existing.length) {
      console.log(`  ↩  User ${u.email} already exists, skipping`);
      createdUsers[u.role] = existing[0];
      continue;
    }

    const passwordHash = await hashPassword(u.password);
    const [user] = await db.insert(schema.users).values({
      email: u.email,
      passwordHash,
      role: u.role,
      isEmailVerified: true,
      diasporaCountry: u.country === "GB" ? "GB" : null,
    }).returning();

    await db.insert(schema.userProfiles).values({
      userId: user.id,
      firstName: u.firstName,
      lastName: u.lastName,
      country: u.country,
      bio: u.role === "SELLER"
        ? "Experienced property developer based in The Gambia with 10+ years in real estate."
        : u.role === "BUYER"
        ? "Diaspora investor looking to invest in Gambian real estate."
        : null,
    });

    // Auto-verify KYC for seller so they can list properties
    if (u.role === "SELLER" || u.role === "ADMIN") {
      await db.insert(schema.kycRecords).values({
        userId: user.id,
        status: "VERIFIED",
        idType: "PASSPORT",
        idNumber: `SEED-${user.id.slice(0, 8).toUpperCase()}`,
        verifiedAt: new Date(),
        verifiedById: null,
      } as any);
    }

    createdUsers[u.role] = user;
    console.log(`  ✓  Created ${u.role} user: ${u.email}`);
  }

  const sellerId = createdUsers["SELLER"]?.id;
  if (!sellerId) { console.log("  ⚠  No seller created — skipping listings"); await pool.end(); return; }

  // ── Exchange Rates ─────────────────────────────────────────────────────────
  const rateRows = [
    { fromCurrency: "GMD", toCurrency: "USD", rate: "0.0151" },
    { fromCurrency: "GMD", toCurrency: "GBP", rate: "0.0120" },
    { fromCurrency: "GMD", toCurrency: "EUR", rate: "0.0140" },
    { fromCurrency: "USD", toCurrency: "GMD", rate: "66.20"  },
    { fromCurrency: "GBP", toCurrency: "GMD", rate: "83.40"  },
    { fromCurrency: "EUR", toCurrency: "GMD", rate: "71.60"  },
  ];

  for (const r of rateRows) {
    const exists = await db.select().from(schema.exchangeRates)
      .where(eq(schema.exchangeRates.fromCurrency, r.fromCurrency)).limit(1);
    if (!exists.length) {
      await db.insert(schema.exchangeRates).values({ ...r, source: "seed" });
    }
  }
  console.log("  ✓  Exchange rates seeded");

  // ── Listings ───────────────────────────────────────────────────────────────
  const listingDefs = [
    {
      title: "Luxury Villa in Kololi with Ocean Views",
      slug: "luxury-villa-kololi-ocean-views",
      description: "A stunning 5-bedroom luxury villa in the heart of Kololi, offering breathtaking Atlantic Ocean views from every room. Features a private pool, landscaped gardens, solar power system, and 24-hour security. Perfect for diaspora investors seeking premium returns.",
      propertyType: "VILLA" as const,
      price: "8500000",
      currency: "GMD" as const,
      region: "Kanifing",
      area: "Kololi",
      bedrooms: 5,
      bathrooms: 4,
      landSizeSqm: "1200",
      buildingSizeSqm: "650",
      latitude: "13.4270",
      longitude: "-16.7000",
      features: ["Swimming Pool", "Solar Power", "Generator", "CCTV", "Smart Home", "Garden"],
      diasporaHighlights: ["Rental Income Potential", "Airport Proximity", "Tourist Area"],
      titleDeedAvailable: true,
      isVerified: true,
      isNegotiable: true,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800"],
    },
    {
      title: "3-Bedroom House in Bakau — Title Deed Available",
      slug: "3bed-house-bakau-title-deed",
      description: "Well-maintained family home in the prestigious Bakau New Town area. Walking distance to Atlantic coast and top international schools. Recently renovated with modern kitchen and Western-style bathrooms. Ideal for families returning to The Gambia.",
      propertyType: "HOUSE" as const,
      price: "3200000",
      currency: "GMD" as const,
      region: "Kanifing",
      area: "Bakau",
      bedrooms: 3,
      bathrooms: 2,
      landSizeSqm: "400",
      buildingSizeSqm: "210",
      latitude: "13.4789",
      longitude: "-16.6830",
      features: ["Generator", "Borehole", "Tiled Throughout", "Modern Kitchen"],
      diasporaHighlights: ["School Proximity", "Beach Access", "Safe Neighborhood"],
      titleDeedAvailable: true,
      isVerified: true,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800"],
    },
    {
      title: "Prime Commercial Land in Brikama — 2 Acres",
      slug: "commercial-land-brikama-2acres",
      description: "Strategic 2-acre commercial plot on the Trans-Gambia Highway in Brikama. Excellent visibility and road frontage. Suitable for shopping complex, warehouse, or mixed-use development. All utility connections available at the boundary.",
      propertyType: "LAND" as const,
      price: "12000000",
      currency: "GMD" as const,
      region: "West Coast Region",
      area: "Brikama",
      landSizeSqm: "8094",
      latitude: "13.2710",
      longitude: "-16.6540",
      features: ["Road Frontage", "Electricity Access", "Water Access", "Fenced"],
      diasporaHighlights: ["High ROI Potential", "Highway Access", "Growth Area"],
      titleDeedAvailable: true,
      isVerified: false,
      isNegotiable: true,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"],
    },
    {
      title: "Modern Apartment in Senegambia Strip — Furnished",
      slug: "modern-apartment-senegambia-furnished",
      description: "Fully furnished 2-bedroom apartment in the vibrant Senegambia entertainment strip. Ideal for short-term rentals or personal use. Features AC, WiFi infrastructure, rooftop terrace access, and is walking distance to restaurants, bars, and the beach.",
      propertyType: "APARTMENT" as const,
      price: "1850000",
      currency: "GMD" as const,
      region: "Kanifing",
      area: "Serrekunda",
      bedrooms: 2,
      bathrooms: 2,
      buildingSizeSqm: "120",
      latitude: "13.4421",
      longitude: "-16.7119",
      features: ["Furnished", "Air Conditioning", "Rooftop Access", "24hr Security"],
      diasporaHighlights: ["Rental Income Potential", "Tourist Area", "Walking to Beach"],
      titleDeedAvailable: false,
      isInstallment: true,
      installmentYears: 3,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800"],
    },
    {
      title: "Family Compound in Serrekunda — Large Plot",
      slug: "family-compound-serrekunda-large",
      description: "Spacious compound property with main house and two separate guest/rental units on 800sqm in central Serrekunda. Currently generating rental income. Owner is relocating abroad. Comes with building permit and partial title deed.",
      propertyType: "COMPOUND" as const,
      price: "4750000",
      currency: "GMD" as const,
      region: "Kanifing",
      area: "Serrekunda",
      bedrooms: 6,
      bathrooms: 4,
      landSizeSqm: "800",
      buildingSizeSqm: "380",
      latitude: "13.4383",
      longitude: "-16.6768",
      features: ["Multiple Units", "Rental Income", "Water Tank", "Solar Lighting"],
      diasporaHighlights: ["Rental Income Ready", "Investment Property", "Central Location"],
      titleDeedAvailable: false,
      isNegotiable: true,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800"],
    },
    {
      title: "Beachfront Land in Sanyang — 1,500 sqm",
      slug: "beachfront-land-sanyang",
      description: "Rare opportunity to own beachfront land in the unspoiled Sanyang beach area, one of The Gambia's most beautiful coastal spots. Perfect for eco-lodge, boutique hotel, or luxury private residence. Panoramic Atlantic views. Government documentation available.",
      propertyType: "LAND" as const,
      price: "25000000",
      currency: "GMD" as const,
      region: "West Coast Region",
      area: "Sanyang",
      landSizeSqm: "1500",
      latitude: "13.1200",
      longitude: "-16.7800",
      features: ["Beach Access", "Panoramic Views", "Private", "Development Ready"],
      diasporaHighlights: ["Tourism Investment", "Unique Opportunity", "Beachfront"],
      titleDeedAvailable: true,
      isVerified: true,
      isNegotiable: false,
      hasElectricity: false,
      hasWater: false,
      images: ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800"],
    },
    {
      title: "New Build 4-Bedroom House in Brusubi",
      slug: "new-build-4bed-brusubi",
      description: "Brand new construction completed in 2024. 4 bedrooms, 3 bathrooms, modern open-plan living in the fast-growing Brusubi residential area. Includes fitted kitchen, ceramic tiles throughout, built-in wardrobes, and a 500sqm garden. Builder warranty available.",
      propertyType: "HOUSE" as const,
      price: "5600000",
      currency: "GMD" as const,
      region: "West Coast Region",
      area: "Brusubi",
      bedrooms: 4,
      bathrooms: 3,
      landSizeSqm: "500",
      buildingSizeSqm: "280",
      yearBuilt: 2024,
      latitude: "13.3900",
      longitude: "-16.7200",
      features: ["New Build", "Modern Kitchen", "Garden", "Parking", "Generator Ready"],
      diasporaHighlights: ["New Construction", "Growth Area", "Family Home"],
      titleDeedAvailable: true,
      isVerified: false,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"],
    },
    {
      title: "Studio Apartment near Westfield Junction",
      slug: "studio-apartment-westfield",
      description: "Compact and affordable studio apartment with self-contained bathroom in a managed block near Westfield Junction. Ideal for young professionals or as a buy-to-let investment. Currently tenanted at D8,000/month. Inspection available on request.",
      propertyType: "APARTMENT" as const,
      price: "480000",
      currency: "GMD" as const,
      region: "Kanifing",
      area: "Westfield",
      bedrooms: 0,
      bathrooms: 1,
      buildingSizeSqm: "45",
      latitude: "13.4531",
      longitude: "-16.6900",
      features: ["Self-Contained", "Tiled", "Ground Floor", "Secure Block"],
      diasporaHighlights: ["Entry-Level Investment", "Tenanted", "City Centre"],
      isInstallment: false,
      hasElectricity: true,
      hasWater: true,
      images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800"],
    },
  ];

  for (const l of listingDefs) {
    const existing = await db.select({ id: schema.listings.id })
      .from(schema.listings).where(eq(schema.listings.slug, l.slug)).limit(1);
    if (existing.length) {
      console.log(`  ↩  Listing "${l.slug}" already exists, skipping`);
      continue;
    }

    const { images, ...listingData } = l;
    const [listing] = await db.insert(schema.listings).values({
      ...listingData,
      sellerId,
      status: "ACTIVE" as const,
      publishedAt: new Date(),
    } as any).returning();

    if (images?.length) {
      await db.insert(schema.listingImages).values(
        images.map((url, i) => ({ listingId: listing.id, url, isPrimary: i === 0, order: i }))
      );
    }

    console.log(`  ✓  Created listing: ${listing.slug}`);
  }

  console.log("\n✅ Seed complete!");
  console.log("   Credentials:");
  console.log("   buyer@kunda.gm  / Test1234!  (BUYER)");
  console.log("   seller@kunda.gm / Test1234!  (SELLER — KYC verified)");
  console.log("   admin@kunda.gm  / Admin1234! (ADMIN)");

  await pool.end();
}

main().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
