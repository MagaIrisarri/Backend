import { Request, Response } from 'express';
import { UserService } from './User.Service.js';

export class UserController {
  constructor(private userService: UserService) {}

  public findAll = async (_req: Request, res: Response) => {
    try {
      const users = await this.userService.findAll();
      res.status(200).json({ data: users });
    } catch (error: any) { res.status(500).json({ message: 'Error buscando usuarios', error: error.message });
    }
  };

  public findById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.findOne({ id: req.params.id as string });
      if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
      res.status(200).json({ data: user });
    } catch (error: any) {
      res.status(500).json({ message: 'Error buscando usuario', error: error.message });
    }
  };

  public findEmployeesByOwner = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.findEmployeesByOwner(req.params.ownerId as string);
      res.status(200).json({ data: users });
    } catch (error: any) {
      res.status(500).json({ message: 'Error buscando empleados', error: error.message });
    }
  };

  public createPublic = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.addPublicUser(req.body);
      res.status(201).json({ message: 'Usario crado Exitosamente', data: user });
    } catch (error: any) {
      res.status(400).json({ message: 'Error creando usuario', error: error.message });
    }
  };

  public createEmployee = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.addEmployee(req.body, req.params.ownerId as string);
      res.status(201).json({ message: 'Empleado creado Exitosamente', data: user });
    } catch (error: any) {
      res.status(400).json({ message: 'Error creando empleado', error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const updatedUser = await this.userService.update({ id: req.params.id as string }, req.body);
      if (!updatedUser) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'Usario actualizado Exitosamente', data: updatedUser });
    } catch (error: any) {
      res.status(500).json({ message: 'Error actualizando usuario', error: error.message });
    }
  };

  public updatePassword = async (req: Request, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const success = await this.userService.updatePassword(req.params.id as string, currentPassword, newPassword);
      if (!success) return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      res.status(200).json({ message: 'Contraseña actualizada correctamente' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error actualizando contraseña', error: error.message });
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const deleted = await this.userService.remove({ id: req.params.id as string });
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'Usuario eliminado Exitosamente' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error eliminando usuario', error: error.message });
    }
  };

  public login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      const user = await this.userService.login(email, password);
      
      if ('error' in user) {
        if (user.error === 'not found') return res.status(404).json({ message: 'User no encontraod' });
        if (user.error === 'user not ACTIVO') return res.status(401).json({ message: 'El usuario no esta activo' });
        if (user.error === 'password incorrect') return res.status(401).json({ message: 'Contraseña incorrecta' });
      }
      res.status(200).json({ data: user });
    } catch (error: any) { res.status(500).json({ message: 'Error al Ingresar', error: error.message });
    }
  };
}