import { Request, Response } from "express";
import prisma from "../../../utils/client";
import { z } from "zod";
import CompagneValidation from "../utils/validation/compagne";
import { validationResult } from "../../../utils/validation/validationResult";
import { Role } from "@prisma/client";

type createCompagne = z.infer<typeof CompagneValidation.createCompagneSchema>;

export default class CompagneController {
  static async createCompagne(req: Request, res: Response): Promise<void> {
    try {
      validationResult(CompagneValidation.createCompagneSchema, req, res);
      const parsedData: createCompagne =
        CompagneValidation.createCompagneSchema.parse(req.body);
      const clientId = req.client?.id;
      if (!clientId) {
        res.status(400).json({ message: "Unauthorized" });
        return;
      }
      const compagne = await prisma.compagne.create({
        data: {
          compagneName: parsedData.compagneName,
          clientId: clientId.toString(),
        },
      });
      if (!compagne) {
        res.status(400).json({ message: "Compagne not created" });
        return;
      }
      const form = await prisma.form.create({
        data: {
          compagneId: compagne.id,
        },
      });
      if (!form) {
        res.status(400).json({ message: "Form not created" });
        return;
      }
      const formFields = await prisma.formField.createMany({
        data: parsedData.fields.map((field: string) => ({
          formId: form.id,
          fieldId: field,
          ordre: parsedData.fields.indexOf(field),
        })),
      });
      if (!formFields) {
        res.status(400).json({ message: "Form fields not created" });
        return;
      }
      res.status(201).json({compagne, form, formFields});
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
}
