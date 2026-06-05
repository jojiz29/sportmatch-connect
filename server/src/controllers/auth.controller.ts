import { Request, Response } from "express";
import { register, login, getProfile } from "../services/auth.service";

export async function registerController(req: Request, res: Response) {
  try {
    const { email, password, name, age, city, gender } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await register({ email, password, name, age, city, gender });

    return res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return res.status(400).json({ error: message });
  }
}

export async function loginController(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const result = await login({ email, password });

    return res.status(200).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    return res.status(401).json({ error: message });
  }
}

export async function profileController(req: Request, res: Response) {
  try {
    const userId = (req as any).userId;
    const profile = await getProfile(userId);

    return res.status(200).json(profile);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to get profile";
    return res.status(404).json({ error: message });
  }
}