import { unlink } from "node:fs/promises";
import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import type { ListingSearchInput } from "@kunda/validators";
import type {
  CreateListingInput,
  UpdateListingInput,
} from "@kunda/validators";
import {
  deleteListingPhoto,
  uploadListingPhoto,
  uploadListingPhotoFromBuffer,
  getImageVariants,
} from "../utils/cloudinary";

const { logger, env, PAGINATION_DEFAULT_LIMIT } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } =
  ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

export class ListingsService {
  async create(input: CreateListingInput, agentId: string) {
    const listing = await prisma.listing.create({
      data: {
        ...input,
        price: input.price,
        agentId,
        status: "DRAFT",
      },
      include: {
        photos: true,
        agent: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
      },
    });

    logger.info("Listing created", { listingId: listing.id, agentId });
    return listing;
  }

  async findById(id: string) {
    return prisma.listing.findUnique({
      where: { id },
      include: {
        photos: {
          orderBy: {
            order: "asc",
          },
        },
        agent: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            kycStatus: true,
          },
        },
      },
    });
  }

  async search(params: ListingSearchInput) {
    const {
      q,
      type,
      region,
      minPrice,
      maxPrice,
      minBedrooms,
      verified,
      page = 1,
      limit = PAGINATION_DEFAULT_LIMIT,
    } = params;

    const where: Record<string, unknown> = {
      status: "PUBLISHED",
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
        { region: { contains: q, mode: "insensitive" } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (region) {
      where.region = { contains: region, mode: "insensitive" };
    }

    if (verified !== undefined) {
      where.verified = verified;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};

      if (minPrice !== undefined) {
        (where.price as { gte?: number }).gte = minPrice;
      }

      if (maxPrice !== undefined) {
        (where.price as { lte?: number }).lte = maxPrice;
      }
    }

    if (minBedrooms !== undefined) {
      where.bedrooms = { gte: minBedrooms };
    }

    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ verified: "desc" }, { createdAt: "desc" }],
        include: {
          photos: {
            where: { isPrimary: true },
            take: 1,
          },
          agent: {
            select: {
              id: true,
              fullName: true,
            },
          },
        },
      }),
      prisma.listing.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      listings,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  async update(id: string, input: UpdateListingInput, agentId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: {
        ...input,
        status: "PENDING_REVIEW",
      },
      include: {
        photos: true,
      },
    });

    logger.info("Listing updated", { listingId: id, agentId });
    return updated;
  }

  async publish(id: string, adminId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    logger.info("Listing published", { listingId: id, adminId });
    return updated;
  }

  async reject(id: string, adminId: string, reason: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status: "REJECTED" },
    });

    logger.info("Listing rejected", { listingId: id, adminId, reason });
    return updated;
  }

  async delete(id: string, agentId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { photos: true },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    for (const photo of listing.photos) {
      await deleteListingPhoto(photo.publicId);
    }

    await prisma.listing.delete({
      where: { id },
    });

    logger.info("Listing deleted", { listingId: id, agentId });
  }

  async addPhoto(
    listingId: string,
    agentId: string,
    fileSource: string | Buffer,
    originalName: string,
    isPrimary = false,
  ) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    const photoCount = await prisma.listingPhoto.count({
      where: { listingId },
    });

    if (photoCount >= 10) {
      throw new Error("PHOTO_LIMIT_REACHED");
    }

    let uploaded: Awaited<ReturnType<typeof uploadListingPhoto>>;

    if (typeof fileSource === "string") {
      uploaded = await uploadListingPhoto(fileSource, listingId, isPrimary);
    } else {
      uploaded = await uploadListingPhotoFromBuffer(
        fileSource,
        listingId,
        originalName,
      );
    }

    if (isPrimary) {
      await prisma.listingPhoto.updateMany({
        where: { listingId },
        data: { isPrimary: false },
      });
    }

    const photo = await prisma.listingPhoto.create({
      data: {
        listingId,
        url: uploaded.secureUrl,
        publicId: uploaded.publicId,
        isPrimary: isPrimary || photoCount === 0,
        order: photoCount,
      },
    });

    logger.info("Photo added to listing", { listingId, photoId: photo.id });
    return { photo, variants: getImageVariants(uploaded.publicId) };
  }

  async deletePhoto(photoId: string, agentId: string) {
    const photo = await prisma.listingPhoto.findUnique({
      where: { id: photoId },
      include: {
        listing: true,
      },
    });

    if (!photo) {
      throw new Error("PHOTO_NOT_FOUND");
    }

    if (photo.listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    await deleteListingPhoto(photo.publicId);
    await prisma.listingPhoto.delete({
      where: { id: photoId },
    });

    if (photo.isPrimary) {
      const next = await prisma.listingPhoto.findFirst({
        where: { listingId: photo.listingId },
        orderBy: { order: "asc" },
      });

      if (next) {
        await prisma.listingPhoto.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }

    logger.info("Photo deleted", { photoId, agentId });
  }

  async registerPhoto(
    listingId: string,
    agentId: string,
    publicId: string,
    url: string,
    isPrimary = false,
  ) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    const photoCount = await prisma.listingPhoto.count({
      where: { listingId },
    });

    if (photoCount >= 10) {
      throw new Error("PHOTO_LIMIT_REACHED");
    }

    if (isPrimary) {
      await prisma.listingPhoto.updateMany({
        where: { listingId },
        data: { isPrimary: false },
      });
    }

    const photo = await prisma.listingPhoto.create({
      data: {
        listingId,
        url: url || `https://res.cloudinary.com/${env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}`,
        publicId: publicId,
        isPrimary: isPrimary || photoCount === 0,
        order: photoCount,
      },
    });

    logger.info("Photo registered", { listingId, photoId: photo.id });
    return photo;
  }

  async getAgentListings(agentId: string) {
    return prisma.listing.findMany({
      where: { agentId },
      include: {
        photos: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: { enquiries: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async saveListing(listingId: string, userId: string) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    await prisma.savedListing.upsert({
      where: {
        userId_listingId: { userId, listingId },
      },
      create: { userId, listingId },
      update: {},
    });

    logger.info("Listing saved", { listingId, userId });
  }

  async unsaveListing(listingId: string, userId: string) {
    await prisma.savedListing.deleteMany({
      where: { userId, listingId },
    });

    logger.info("Listing unsaved", { listingId, userId });
  }

  async reorderPhotos(listingId: string, agentId: string, orderedIds: string[]) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.listingPhoto.update({
          where: { id },
          data: { order: index },
        }),
      ),
    );

    logger.info("Photos reordered", { listingId, orderedIds });
  }

  async setPrimaryPhoto(
    listingId: string,
    agentId: string,
    photoId: string,
  ) {
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error("LISTING_NOT_FOUND");
    }

    if (listing.agentId !== agentId) {
      throw new Error("FORBIDDEN");
    }

    await prisma.$transaction([
      prisma.listingPhoto.updateMany({
        where: { listingId },
        data: { isPrimary: false },
      }),
      prisma.listingPhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      }),
    ]);

    logger.info("Primary photo set", { listingId, photoId });
  }

  async getSavedListings(userId: string) {
    const saved = await prisma.savedListing.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            photos: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { savedAt: "desc" },
    });

    return saved.map((entry) => entry.listing);
  }
}

export const listingsService = new ListingsService();
