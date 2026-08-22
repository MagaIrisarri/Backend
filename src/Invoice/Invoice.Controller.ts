import { Request, Response } from "express";
import { InvoiceService } from "./Invoice.Service.js";

export class InvoiceController {
  constructor(private service: InvoiceService) {}

  public findAll = async (_req: Request, res: Response) => {
    try {
      const invoices = await this.service.findAll();
      res.status(200).json({ data: invoices });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener facturas", error: error.message });
    }
  };

  public findOne = async (req: Request, res: Response) => {
    try {
      const invoice = await this.service.findOne(req.params.id as string);
      if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });
      res.status(200).json({ data: invoice });
    } catch (error: any) {
      res.status(500).json({ message: "Error al obtener la factura", error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const invoice = await this.service.create(req.body);
      res.status(201).json({ message: "Factura generada exitosamente", data: invoice });
    } catch (error: any) {
      res.status(400).json({ message: "Error al generar la factura", error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const invoice = await this.service.update(req.params.id as string, req.body);
      if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });
      res.status(200).json({ message: "Factura actualizada exitosamente", data: invoice });
    } catch (error: any) {
      res.status(500).json({ message: "Error al actualizar la factura", error: error.message });
    }
  };

  public remove = async (req: Request, res: Response) => {
    try {
      const deleted = await this.service.remove(req.params.id as string);
      if (!deleted) return res.status(404).json({ message: "Factura no encontrada" });
      res.status(200).json({ message: "Factura anulada correctamente" });
    } catch (error: any) {
      res.status(500).json({ message: "Error al anular la factura", error: error.message });
    }
  };
}