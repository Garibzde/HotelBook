import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma.js";
import { ConflictError, NotFoundError, UnauthorizedError } from "../lib/errors.js";
import { signToken } from "../utils/jwt.js";
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.js";

const SALT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", SALT_ROUNDS);

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  managedHotelId: true,
  createdAt: true,
} as const;

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });

  if (existing) {
    throw new ConflictError("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
    },
    select: publicUserSelect,
  });

  return { user, token: signToken(user.id) };
}

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  const hashToCompare = user?.passwordHash ?? DUMMY_HASH;
  const isPasswordValid = await bcrypt.compare(input.password, hashToCompare);

  if (!user || !isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const { passwordHash: _passwordHash, ...publicUser } = user;

  return { user: publicUser, token: signToken(user.id) };
}
export async function getProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
}