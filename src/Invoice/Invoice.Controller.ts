import { Request, Response } from 'express';
import { InvoiceService } from './Invoice.Service.js';

export class InvoiceController {
  constructor(private service: InvoiceService) {}

  public findByClientId = async (req: Request, res: Response) => {
    const invoices = await this.service.findByClientId(req.params.clientId as string);
    return res.status(200).json({
      message: invoices.length === 0 ? 'No se encontraron facturas' : 'Facturas encontradas',
      data: invoices,
    });
  };

  public pay = async (req: Request, res: Response) => {
    const invoice = await this.service.pay(req.params.id as string, req.body);
    res.status(200).json({ message: 'Factura pagada exitosamente', data: invoice });
  };
}