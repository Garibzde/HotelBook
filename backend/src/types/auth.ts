import type { Role } from "../generated/prisma/client.js";

export interface AuthUser {
  sub: number;
  role: Role;
  managedHotelId: number | null;
}