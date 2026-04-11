import { createHash } from "node:crypto";
import { ListingStatus, PrismaClient, PropertyType } from "@prisma/client";

const prisma = new PrismaClient();

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function main() {
  console.log("Seeding database...");

  const agent = await prisma.user.upsert({
    where: { email: "lamin@kundaproperties.gm" },
    update: {},
    create: {
      email: "lamin@kundaproperties.gm",
      passwordHash: sha256("password123"),
      fullName: "Lamin Fatty",
      phone: "+220 777 1234",
      country: "The Gambia",
      role: "AGENT",
      kycStatus: "APPROVED",
      emailVerified: true,
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: "fatou@example.com" },
    update: {},
    create: {
      email: "fatou@example.com",
      passwordHash: sha256("password123"),
      fullName: "Fatou Jallow",
      phone: "+44 7700 123456",
      country: "United Kingdom",
      role: "BUYER",
      kycStatus: "APPROVED",
      emailVerified: true,
    },
  });

  const listings = [
    {
      title: "Family home in Kololi",
      description:
        "A spacious family compound in the heart of Kololi, minutes from the beach.",
      location: "Kololi, West Coast Region",
      region: "West Coast Region",
      price: 85000,
      currency: "GBP",
      bedrooms: 4,
      bathrooms: 3,
      sizeSqm: 280,
      type: PropertyType.HOUSE,
      status: ListingStatus.PUBLISHED,
      verified: true,
      latitude: 13.4549,
      longitude: -16.7041,
    },
    {
      title: "Residential plot in Brufut",
      description:
        "Clean title plot in a fast-growing residential area near Brufut Heights.",
      location: "Brufut, West Coast Region",
      region: "West Coast Region",
      price: 22000,
      currency: "GBP",
      bedrooms: 0,
      bathrooms: 0,
      sizeSqm: 450,
      type: PropertyType.LAND,
      status: ListingStatus.PUBLISHED,
      verified: true,
      latitude: 13.3769,
      longitude: -16.7527,
    },
    {
      title: "Modern apartment in Banjul",
      description:
        "Second-floor apartment in a quiet Banjul street, recently renovated.",
      location: "Banjul, Banjul Capital City",
      region: "Banjul Capital City",
      price: 45000,
      currency: "GBP",
      bedrooms: 2,
      bathrooms: 1,
      sizeSqm: 95,
      type: PropertyType.APARTMENT,
      status: ListingStatus.PUBLISHED,
      verified: false,
      latitude: 13.4549,
      longitude: -16.579,
    },
  ];

  await prisma.listing.deleteMany({
    where: {
      agentId: agent.id,
    },
  });

  for (const listing of listings) {
    await prisma.listing.create({
      data: { ...listing, agentId: agent.id },
    });
  }

  console.log(`Created agent: ${agent.email}`);
  console.log(`Created buyer: ${buyer.email}`);
  console.log(`Created ${listings.length} listings`);
  console.log("Seeding complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
