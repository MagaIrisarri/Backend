import { Request, Response } from 'express';
import { UserService } from './User.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';

export class UserController {
  constructor(private userService: UserService) {}

  public findAll = catchAsync(async (_req: Request, res: Response) => {
    const users = await this.userService.findAll();
    res.status(200).json({ data: users });
  });

  public findById = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.findOne({ id: req.params.id as string });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ data: user });
  });

  public findEmployeesByOwner = catchAsync(async (req: Request, res: Response) => {
    const users = await this.userService.findEmployeesByOwner(req.params.ownerId as string);
    res.status(200).json({ data: users });
  });

  public createPublic = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.addPublicUser(req.body);
    res.status(201).json({ message: 'Usuario creado exitosamente', data: user });
  });

  public createEmployee = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.addEmployee(req.body, req.params.ownerId as string);
    res.status(201).json({ message: 'Empleado creado exitosamente', data: user });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const updatedUser = await this.userService.update({ id: req.params.id as string }, req.body);
    if (!updatedUser) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ message: 'Usuario actualizado exitosamente', data: updatedUser });
  });

  public reactivate = catchAsync(async (req: Request, res: Response) => {
    const reactivatedUser = await this.userService.reactivate({ id: req.params.id as string });
    if (!reactivatedUser) throw new AppError('User not found', 404);
    res.status(200).json({ message: 'Usuario reactivado Exitosamente', data: reactivatedUser });
  });

  public updatePassword = catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const success = await this.userService.updatePassword(req.params.id as string, currentPassword, newPassword);
    if (!success) throw new AppError('Contraseña actual incorrecta', 400);
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.userService.remove({ id: req.params.id as string });
    if (!deleted) throw new AppError('User not found', 404);
    res.status(200).json({ message: 'Usuario eliminado Exitosamente' });
  });

  public login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await this.userService.login(email, password);
    
    if ('error' in user) {
      if (user.error === 'not found') throw new AppError('Usuario no encontrado', 404);
      if (user.error === 'user not ACTIVO') throw new AppError('El usuario no esta activo', 401);
      if (user.error === 'password incorrect') throw new AppError('Contraseña incorrecta', 401);
    }
    res.status(200).json({ data: user });
  });
}