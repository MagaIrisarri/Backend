import { Request, Response } from 'express';
import { orm } from '../Shared/db/orm.js';
import { VehicleService } from './Vehicle.Service.js';
import { VehicleRepository } from './Vehicle.Repository.js'

const vehicleRepository = new VehicleRepository(orm.em);
const vehicleService = new VehicleService(vehicleRepository);

async function add(req: Request, res: Response) {
  try {
    const userId = req.params.userId as string;

    const vehicle = await vehicleService.createVehicle(req.body, userId);

    return res.status(201).json({ 
      message: "Vehiculo creado exitosamente", 
      data: vehicle, 
    });
  } catch (error: any) {
    if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
      return res.status(409).json({ 
        message: "Ya existe un vehículo registrado con esa patente.",
      });
    }
    return res.status(500).json({ 
      message: "Error al crear el vehiculo", 
      error: error.message,
    });
  }
}

async function findAll(req: Request, res: Response) {
  try {
    const vehicleList = await vehicleService.findAllVehicle();

    const message = vehicleList.length === 0
        ? "No se encontraron vehiculos"
        : "Vehiculos encontrados";
    
    return res.status(200).json({
      message,
      data: vehicleList,
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

async function findOneById(req: Request, res: Response) {
  try {
    const vehicle = await vehicleService.findVehicleById({ id: req.params.id as string});

    if(!vehicle) {
      return res.status(404).json({
        message: "No se encontró el vehiculo",
      })
    }

    return res.status(200).json({ 
      message: "Vehiculo encontrado", 
      data: vehicle, 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

async function update(req: Request, res: Response) {
  try {
    const vehicle = await vehicleService.updateVehicle(
      { id: req.params.id as string }, 
      req.body
    );

    if(!vehicle) {
      return res.status(404).json({
        message: "No se encontró el vehiculo",
      });
    }

    return res.status(200).json({
      message: "Vehiculo actualizado exitosamente",
      data: vehicle,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message, 
    });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const deleted = await vehicleService.deleteVehicle({ id: req.params.id as any });

    if (!deleted) {
      return res.status(404).json({ 
        message: "No se encontró el vehiculo", 
      });
    }

    return res.status(200).json({ 
      message: "Vehiculo eliminado exitosamente", 
    });
  } catch (error: any) {
    return res.status(500).json({ 
      error: error.message,
    });
  }
}

export { add, findAll, findOneById, update, remove };
