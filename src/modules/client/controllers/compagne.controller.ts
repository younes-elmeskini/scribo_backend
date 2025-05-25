import { Request, Response } from "express";
import prisma from "../../../utils/client";
import { z } from "zod";
import CompagneValidation from "../utils/validation/compagne";
import { validationResult } from "../../../utils/validation/validationResult";
import { Role } from "@prisma/client";

type createCompagne = z.infer<typeof CompagneValidation.createCompagneSchema>;

export default class CompagneController {
  static async createCompagne(req: Request, res: Response): Promise<void> {
    const clientId = req.client?.clientId;
    if (!clientId) {
      res.status(4001).json({ message: "Unauthorized" });
      return;
    }
    validationResult(CompagneValidation.createCompagneSchema, req, res);

    const parsedData: createCompagne =
      CompagneValidation.createCompagneSchema.parse(req.body);
    const compagne = await prisma.compagne.create({
      data: {
        ...parsedData,
      },
    });
    if (!compagne) {
      res.status(400).json({ message: "Compagne not created" });
      return;
    }
    const team = await prisma.team.create({
        data:{
            clientId:clientId.toString(),
            compagneId: compagne.compagneId,
            role: "OWNER"
        }
    })
    res.json({ message: "Compagne created", compagne, });
    res.status(201).json(compagne);
  }
}
