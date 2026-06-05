import prisma from "../config/database";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "default_secret_change_me";
const JWT_EXPIRES_IN = "7d";

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  age?: number;
  city?: string;
  gender?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatar_url: string | null;
    level: string | null;
    fitcoins_balance: number;
    trust_score: number;
  };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { email, password, name, age, city, gender } = input;

  const existingUser = await prisma.profiles.findFirst({
    where: {
      OR: [
        { name: email },
        { avatar_url: email },
      ],
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.profiles.create({
    data: {
      name: name || email.split("@")[0],
      age: age || null,
      city: city || null,
      gender: gender || null,
      avatar_url: email,
      fitcoins_balance: 100,
      trust_score: 100,
      level: "Principiante",
      preferred_sports: [],
      matches_played: 0,
    },
  });

  const token = jwt.sign(
    { userId: user.id, role: user.user_role || "PLAYER" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: email,
      name: user.name,
      avatar_url: user.avatar_url,
      level: user.level,
      fitcoins_balance: user.fitcoins_balance || 0,
      trust_score: user.trust_score || 100,
    },
  };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await prisma.profiles.findFirst({
    where: {
      avatar_url: email,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(password, user.id);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    { userId: user.id, role: user.user_role || "PLAYER" },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: email,
      name: user.name,
      avatar_url: user.avatar_url,
      level: user.level,
      fitcoins_balance: user.fitcoins_balance || 0,
      trust_score: user.trust_score || 100,
    },
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.profiles.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      age: true,
      city: true,
      avatar_url: true,
      bio: true,
      trust_score: true,
      fitcoins_balance: true,
      level: true,
      preferred_sports: true,
      matches_played: true,
      gender: true,
      user_role: true,
      onboarding_completed: true,
      created_at: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}