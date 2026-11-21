import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma.js";

const makeRooms = (basePrice: number) => [
  { roomNumber: "101", name: "Standard Single", type: "SINGLE" as const, pricePerNight: basePrice, capacity: 1 },
  { roomNumber: "102", name: "Standard Double", type: "DOUBLE" as const, pricePerNight: Math.round(basePrice * 1.5), capacity: 2 },
  { roomNumber: "201", name: "Twin Room", type: "TWIN" as const, pricePerNight: Math.round(basePrice * 1.6), capacity: 2 },
  { roomNumber: "301", name: "Family Room", type: "FAMILY" as const, pricePerNight: Math.round(basePrice * 2.2), capacity: 4 },
  { roomNumber: "401", name: "Suite", type: "SUITE" as const, pricePerNight: Math.round(basePrice * 3), capacity: 3 },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Seed must not run in production");
  }

  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.image.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
  await prisma.hotel.deleteMany();

  const baku = await prisma.hotel.create({
    data: {
      name: "Caspian Palace",
      city: "Baku",
      address: "Neftchilar Avenue 1",
      description: "Luxury seaside hotel in the heart of Baku.",
      stars: 5,
      phone: "+994 12 000 00 01",
      rooms: { create: makeRooms(120) },
    },
  });

  const gabala = await prisma.hotel.create({
    data: {
      name: "Gabala Mountain Resort",
      city: "Gabala",
      address: "Nohur Lake Road 5",
      description: "Mountain resort surrounded by forests and fresh air.",
      stars: 4,
      phone: "+994 24 000 00 02",
      rooms: { create: makeRooms(90) },
    },
  });

  const sheki = await prisma.hotel.create({
    data: {
      name: "Sheki Heritage Inn",
      city: "Sheki",
      address: "Old Town Street 12",
      description: "Cozy inn near the Khan's Palace.",
      stars: 3,
      phone: "+994 24 000 00 03",
      rooms: { create: makeRooms(60) },
    },
  });

  const hash = (password: string) => bcrypt.hash(password, 10);

  await prisma.user.createMany({
    data: [
      { name: "Site Admin", email: "admin@hotelbook.az", passwordHash: await hash("Admin123!"), role: "ADMIN" },
      { name: "Baku Manager", email: "manager.baku@hotelbook.az", passwordHash: await hash("Manager123!"), role: "MANAGER", managedHotelId: baku.id },
      { name: "Gabala Manager", email: "manager.gabala@hotelbook.az", passwordHash: await hash("Manager123!"), role: "MANAGER", managedHotelId: gabala.id },
      { name: "Sheki Manager", email: "manager.sheki@hotelbook.az", passwordHash: await hash("Manager123!"), role: "MANAGER", managedHotelId: sheki.id },
      { name: "Test User", email: "user@hotelbook.az", passwordHash: await hash("User123!"), role: "USER" },
      { name: "Second User", email: "user2@hotelbook.az", passwordHash: await hash("User123!"), role: "USER" },
    ],
  });

  console.log("Seed completed: 3 hotels, 15 rooms, 6 users");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });