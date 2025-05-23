import { Request, Response } from "express";
import prisma from "../../../utils/client";
import { z } from "zod";
import * as argon2 from "argon2";
import { Client } from "@prisma/client";
import { generateToken } from "../middleware/auth";
import Validation from "../utils/validation/auth";

type CreateUserInput = z.infer<typeof Validation.createUserSchema>;

type LoginUserInput = z.infer<typeof Validation.loginSchema>;


export default class AuthController {
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = Validation.createUserSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error.";
        res.status(400).json({ message: firstError });
        return;
      }
      const parsedData: CreateUserInput = Validation.createUserSchema.parse(
        req.body
      );
      const clientExists = await prisma.client.findUnique({
        where: { email: parsedData.email },
      });
      if (clientExists) {
        res.status(409).json({ message: "User already exists" });
        return;
      }
      const hashedPassword: string = await argon2.hash(parsedData.password);
      const client: Client = await prisma.client.create({
        data: {
          firstName: parsedData.firstName,
          lastName:parsedData.lastName,
          email: parsedData.email,
          password: hashedPassword,
        },
      });
      res.status(201).json(client);
    } catch (error) {
      res.status(500).json({ message: "Authentication failed" });
    }
  }
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const validationResult = Validation.loginSchema.safeParse(req.body);
      if (!validationResult.success) {
        const firstError =
          validationResult.error.errors[0]?.message || "Validation error.";
        res.status(400).json({ message: firstError });
        return;
      }
      const parsedData: LoginUserInput = Validation.loginSchema.parse(req.body);
      const teacher = await prisma.client.findUnique({
        where: { email: parsedData.email },
      });

      if (!teacher) {
        res.status(404).json({ message: "Invalid email" });
        return;
      }

      const isPasswordValid: boolean = await argon2.verify(
        teacher.password!,
        parsedData.password
      );
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      const token = generateToken(teacher);
      if (!token) {
        res.status(401).json({ message: "Invalid credentials" });
        return;
      }
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({
        message: "Login successful",
        user: {
          userId: teacher.clientId,
          email: teacher.email,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  }
  static async clientData(req: Request, res: Response): Promise<void> {
    try {
      const teacherId = req.client?.clientId;
      if (!teacherId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const teacher = await prisma.client.findUnique({
        where: { clientId: teacherId.toString() },
        select: {
          clientId: true,
          firstName: true,
          lastName: true,
          email: true,
          profilImage: true,
        },
      });
      if (!teacher) {
        res.status(404).json({ message: "User not found" });
        return;
      }
      res.status(200).json({ data: teacher });
    } catch (error) {
      console.error("Error fetching Teacher data:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
  static async logout(req: Request, res: Response) {
    res.clearCookie("token");
    res.status(200).json({ message: "Logout successful" });
  }
}