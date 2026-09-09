import { Request, Response } from 'express';
import { InvoiceService } from './Invoice.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class InvoiceController {
  constructor(private service: InvoiceService) {}

  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const invoices = await this.service.findAll();
    res.status(200).json({ data: invoices });
  });

  public findOne = catchAsync(async (req: Request, res: Response) => {
    const invoice = await this.service.findOne(req.params.id as string);
    if (!invoice) throw new AppError('Factura no encontrada', 404);
    res.status(200).json({ data: invoice });
  });

  public findByClientId = catchAsync(async (req: Request, res: Response) => {
    const invoices = await this.service.findByClientId(req.params.clientId as string);
    return res.status(200).json({
      message: invoices.length === 0 ? 'No se encontraron facturas' : 'Facturas encontradas',
      data: invoices,
    });
  });

  public create = catchAsync(async (req: Request, res: Response) => {
    const invoice = await this.service.create(req.body);
    res.status(201).json({ message: 'Factura generada exitosamente', data: invoice });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const invoice = await this.service.update(req.params.id as string, req.body);
    if (!invoice) throw new AppError('Factura no encontrada', 404);
    res.status(200).json({ message: 'Factura actualizada exitosamente', data: invoice });
  });

  public remove = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.service.remove(req.params.id as string);
    if (!deleted) throw new AppError('Factura no encontrada', 404);
    res.status(200).json({ message: 'Factura anulada correctamente' });
  });
}