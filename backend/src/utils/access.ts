import type { AuthUser } from "../types/auth.js";

export function canManageHotel(user: AuthUser, hotelId: number): boolean {
  if (user.role === "ADMIN") {
    return true;
  }

  return user.role === "MANAGER" && user.managedHotelId === hotelId;
}