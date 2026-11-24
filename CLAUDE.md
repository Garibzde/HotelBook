# Project rules for AI assistants

## Project
HotelBook is a multi-hotel reservation REST API. Guests (USER) search hotels and rooms and book dates, hotel managers (MANAGER) run only their own hotel's rooms and bookings, and admins (ADMIN) run the whole platform.

## Stack
- Node.js 24, Express 5, TypeScript (ESM), PostgreSQL, Prisma 7, Zod 4, Vitest, JWT.
- ESM project: relative imports must end with `.js` (e.g. `import app from "./app.js"`).
- Prisma client is imported only from src/lib/prisma.ts. Never create a new PrismaClient.
  The generated client lives in src/generated/prisma (git-ignored, create it with `npx prisma generate`).
- Express 5 catches async errors: do not use asyncHandler, do not catch errors
  just to return res.status(500). Throw the error classes from src/lib/errors.ts.
- Zod 4 syntax: `z.email()`, `z.coerce.number()`. Validate with `validate(schema, data)` from src/utils/validate.ts.
- Money is `Decimal` (never Float). Check-in and check-out are date-only (`@db.Date`, format YYYY-MM-DD).
- Configuration comes only from src/config/env.ts, never from process.env directly.

## Structure
- src/schemas/<name>.schema.ts          Zod schemas + z.infer types
- src/services/<name>.service.ts        business logic and Prisma, no req/res
- src/controllers/<name>.controller.ts  parse input, call service, send response
- src/routes/<name>.routes.ts           routes + middleware, mounted in src/routes/index.ts under /api
- src/middleware/                       authenticate, authorize, errorHandler, notFound, httpLogger
- src/lib/                              prisma.ts, logger.ts, errors.ts
- src/utils/                            response.ts, validate.ts, jwt.ts
- The logged-in user is req.user!.sub (id) and req.user!.role.
  Managers also have req.user!.managedHotelId (null for other roles).
- Success responses use `sendSuccess(res, data, message, status)`. Error responses are formatted only by errorHandler.

## Models
- User (role: USER | MANAGER | ADMIN, managedHotelId?), Hotel, Room, Booking, Review, Image, Payment (bonus).
- Hotel 1-n Room. Hotel 1-n User (managers, onDelete SetNull). Hotel/Room 1-n Image.
- User 1-n Booking, Room 1-n Booking (both Restrict). User n-n Room through Booking
  (checkIn, checkOut, guests, totalPrice, status, createdAt).
- Booking 1-1 Payment, Booking 1-1 Review (both Cascade).
- Room number is unique per hotel: `@@unique([hotelId, roomNumber])`.

## Business rules (every rule must have a test)
- The same room cannot be booked for overlapping dates (CANCELLED bookings are ignored):
  overlap means `new.checkIn < existing.checkOut AND new.checkOut > existing.checkIn` -> 409.
  Check and insert run in one transaction with a lock on the room row.
- checkOut must be after checkIn, checkIn cannot be in the past, guests cannot exceed room capacity -> 400.
- totalPrice = nights * pricePerNight, always calculated on the server -> never taken from the request.
- Inactive hotels and rooms cannot be booked and are hidden from lists -> 404.
- Register always creates a USER; `role` from the request body is ignored.
- A user can only view and cancel their own bookings; anyone else -> 404.
- A manager can only touch rooms and bookings of their own hotel; anyone else -> 404.
- Cancel is allowed only in PENDING or CONFIRMED status and before check-in -> otherwise 409.
- Status flow: PENDING -> CONFIRMED -> CHECKED_IN -> COMPLETED (CANCELLED separately); invalid transition -> 409.
- A review can only be written once, by the booking owner, for a COMPLETED booking -> otherwise 409.
- Email is unique and stored lowercase -> 409 on duplicate.
- Hotels and rooms are never deleted, only deactivated (`isActive = false`).

## Security
- Owned resources: add userId (or the manager's hotelId) to the where clause in find/update/delete; not found -> 404.
- Validate every request body, params and query with Zod.
- Never return passwordHash. Secrets live only in .env (never commit it, keep .env.example up to date).
- Login errors are always "Invalid email or password" (no user enumeration).
- File uploads: image MIME types only, size limit, random file names.
- Do not log passwords, tokens or Authorization headers.

## Commands
- npm run dev, npm test, npm run typecheck
- npx prisma migrate dev --name <name>, npx prisma generate, npx prisma db seed
