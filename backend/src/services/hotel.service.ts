import type { Prisma } from "../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../lib/errors.js";
import { canManageHotel } from "../utils/access.js";
import { buildMeta, getPagination } from "../utils/pagination.js";
import type { AuthUser } from "../types/auth.js";
import type {
  CreateHotelInput,
  ListHotelsQuery,
  UpdateHotelInput,
} from "../schemas/hotel.schema.js";

const hotelSelect = {
  id: true,
  name: true,
  city: true,
  address: true,
  description: true,
  stars: true,
  phone: true,
  isActive: true,
  createdAt: true,
} as const;

const hotelDetailSelect = {
  ...hotelSelect,
  images: { select: { id: true, url: true } },
  _count: { select: { rooms: { where: { isActive: true } } } },
} as const;

async function getHotelOrThrow(id: number) {
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!hotel) {
    throw new NotFoundError("Hotel not found");
  }

  return hotel;
}

export async function listHotels(query: ListHotelsQuery) {
  const { page, limit, city, stars, search, sort, order } = query;

  const where: Prisma.HotelWhereInput = { isActive: true };

  if (city) {
    where.city = { equals: city, mode: "insensitive" };
  }

  if (stars) {
    where.stars = stars;
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const primaryOrder: Prisma.HotelOrderByWithRelationInput =
    sort === "name" ? { name: order } : sort === "stars" ? { stars: order } : { createdAt: order };

  const { skip, take } = getPagination(page, limit);

  const [items, total] = await prisma.$transaction([
    prisma.hotel.findMany({
      where,
      select: hotelSelect,
      orderBy: [primaryOrder, { id: "asc" }],
      skip,
      take,
    }),
    prisma.hotel.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getHotel(id: number) {
  const hotel = await prisma.hotel.findFirst({
    where: { id, isActive: true },
    select: hotelDetailSelect,
  });

  if (!hotel) {
    throw new NotFoundError("Hotel not found");
  }

  return hotel;
}

export async function createHotel(input: CreateHotelInput) {
  return prisma.hotel.create({
    data: input,
    select: hotelSelect,
  });
}

export async function updateHotel(user: AuthUser, id: number, input: UpdateHotelInput) {
  if (!canManageHotel(user, id)) {
    throw new NotFoundError("Hotel not found");
  }

  await getHotelOrThrow(id);

  return prisma.hotel.update({
    where: { id },
    data: input,
    select: hotelSelect,
  });
}

export async function setHotelStatus(id: number, isActive: boolean) {
  await getHotelOrThrow(id);

  return prisma.hotel.update({
    where: { id },
    data: { isActive },
    select: hotelSelect,
  });
}