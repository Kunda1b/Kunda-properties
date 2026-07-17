import { PrismaClient, UserRole, PropertyType, PropertyStatus, ListingCurrency } from "@prisma/client";
import bcrypt from "bcryptjs";
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Kunda Properties...");

  const adminPw = await bcrypt.hash("Admin@Kunda2024!", 12);
  await prisma.user.upsert({ where: { email: "admin@kundaproperties.gm" }, update: {}, create: {
    email: "admin@kundaproperties.gm", passwordHash: adminPw, role: UserRole.ADMIN,
    isEmailVerified: true, preferredCurrency: ListingCurrency.GMD,
    profile: { create: { firstName: "Kunda", lastName: "Admin", country: "GM" } },
  }});

  const agentPw = await bcrypt.hash("Agent@Kunda2024!", 12);
  const agent = await prisma.user.upsert({ where: { email: "agent@kundaproperties.gm" }, update: {}, create: {
    email: "agent@kundaproperties.gm", phone: "+2203001234", passwordHash: agentPw,
    role: UserRole.AGENT, isEmailVerified: true, isPhoneVerified: true,
    preferredCurrency: ListingCurrency.GMD,
    profile: { create: { firstName: "Lamin", lastName: "Ceesay", city: "Banjul", country: "GM",
      bio: "Licensed agent with 10+ years in Greater Banjul Area.", languages: ["en","wo","man"] } },
    kyc: { create: { status: "VERIFIED", idType: "NATIONAL_ID", idCountry: "GM", verifiedAt: new Date() } },
  }});

  const buyerPw = await bcrypt.hash("Buyer@Kunda2024!", 12);
  await prisma.user.upsert({ where: { email: "buyer@example.com" }, update: {}, create: {
    email: "buyer@example.com", passwordHash: buyerPw, role: UserRole.BUYER,
    isEmailVerified: true, diasporaCountry: "GB", preferredCurrency: ListingCurrency.GBP,
    profile: { create: { firstName: "Fatou", lastName: "Jallow", country: "GB", city: "London",
      nationality: "GM", languages: ["en","wo"] } },
  }});

  const rates = [
    { fromCurrency: "USD", toCurrency: "GMD", rate: 67.5 },
    { fromCurrency: "GBP", toCurrency: "GMD", rate: 85.2 },
    { fromCurrency: "EUR", toCurrency: "GMD", rate: 73.1 },
    { fromCurrency: "GMD", toCurrency: "USD", rate: 0.0148 },
    { fromCurrency: "GMD", toCurrency: "GBP", rate: 0.0117 },
    { fromCurrency: "GMD", toCurrency: "EUR", rate: 0.0137 },
  ];
  for (const r of rates) {
    await prisma.exchangeRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency: r.fromCurrency, toCurrency: r.toCurrency } },
      update: { rate: r.rate }, create: r,
    });
  }

  const listings = [
    { title: "Luxury 4-Bed Villa with Pool — Kololi", slug: "luxury-villa-pool-kololi",
      description: "Stunning modern villa in Kololi with private pool, solar panels, and 24/7 generator. Perfect for diaspora families or investment. Near beach and international schools.",
      propertyType: PropertyType.VILLA, price: 350000, currency: ListingCurrency.USD, priceUsd: 350000,
      address: "Senegambia Road, Kololi", region: "Kanifing", area: "Kololi",
      latitude: 13.4469, longitude: -16.7076,
      bedrooms: 4, bathrooms: 3, toilets: 4, landSizesqm: 800, buildingSizesqm: 420, yearBuilt: 2020, floors: 2,
      features: ["swimming_pool","generator","solar_panels","borehole","garage","security","cctv","garden"],
      furnished: true, hasElectricity: true, hasWater: true, hasInternet: true, hasSecurity: true,
      titleDeedAvailable: true, isNegotiable: false,
      diasporaHighlights: ["Rental yield $2,500-3,500/month","5 min to beach","Near international schools","Managed rental available"],
      status: PropertyStatus.ACTIVE },
    { title: "3-Bed House in Bakoteh — Investment Opportunity", slug: "3bed-house-bakoteh",
      description: "Well-maintained house in rapidly developing Bakoteh. Secure compound with boys quarters. Strong rental demand from expats and professionals.",
      propertyType: PropertyType.HOUSE, price: 4500000, currency: ListingCurrency.GMD, priceUsd: 66600,
      address: "Pipeline Road, Bakoteh", region: "Kanifing", area: "Bakoteh",
      latitude: 13.455, longitude: -16.682,
      bedrooms: 3, bathrooms: 2, toilets: 3, landSizesqm: 450, buildingSizesqm: 185, yearBuilt: 2015,
      features: ["generator","borehole","compound_wall","boys_quarters"],
      furnished: false, hasElectricity: true, hasWater: true, isNegotiable: true,
      titleDeedAvailable: true,
      diasporaHighlights: ["Rental income D15,000-20,000/month","Rapidly developing area","Room for extension"],
      status: PropertyStatus.ACTIVE },
    { title: "Prime Land Plot in Tabokoto — Build Your Dream", slug: "land-plot-tabokoto",
      description: "Fully fenced 600sqm plot in desirable Tabokoto. All documentation ready for quick transfer. Ideal for custom home or rental development.",
      propertyType: PropertyType.LAND, price: 85000, currency: ListingCurrency.USD, priceUsd: 85000,
      address: "Tabokoto Junction Road", region: "Kanifing", area: "Tabokoto",
      latitude: 13.438, longitude: -16.691,
      landSizesqm: 600, hasElectricity: true,
      features: ["fenced","corner_plot","road_access"],
      titleDeedAvailable: true, isNegotiable: true,
      diasporaHighlights: ["Clear title deed ready for transfer","Surveyed and registered","Strong capital appreciation"],
      status: PropertyStatus.ACTIVE },
    { title: "Modern 2-Bed Apartment — Bijilo Beachside", slug: "2bed-apartment-bijilo",
      description: "Elegant apartment near Bijilo beach in a gated development. High standard finishes, shared pool, backup generator. Perfect for holiday rentals.",
      propertyType: PropertyType.APARTMENT, price: 125000, currency: ListingCurrency.USD, priceUsd: 125000,
      address: "Coastal Road, Bijilo", region: "Kombo North", area: "Bijilo",
      latitude: 13.408, longitude: -16.729,
      bedrooms: 2, bathrooms: 2, toilets: 2, buildingSizesqm: 95, yearBuilt: 2019, floors: 3,
      features: ["swimming_pool","generator","24hr_security","parking","air_conditioning"],
      furnished: true, hasElectricity: true, hasWater: true, hasInternet: true, hasSecurity: true,
      titleDeedAvailable: true, isInstallment: true, installmentYears: 3,
      diasporaHighlights: ["Holiday rental $150-200/night","Managed rental program","Walk to beach","3-year installment"],
      status: PropertyStatus.ACTIVE },
  ];

  for (const l of listings) {
    await prisma.listing.upsert({
      where: { slug: l.slug }, update: {},
      create: { ...l, sellerId: agent.id, publishedAt: new Date() },
    });
  }

  console.log("\nSeeded successfully!");
  console.log("Admin:  admin@kundaproperties.gm / Admin@Kunda2024!");
  console.log("Agent:  agent@kundaproperties.gm / Agent@Kunda2024!");
  console.log("Buyer:  buyer@example.com / Buyer@Kunda2024!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
