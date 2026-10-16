import { Request, Response } from 'express';
import { UserService } from './User.Service.js';
import { catchAsync } from '../Shared/utils/catchAsync.js';
import { AppError } from '../Shared/utils/AppError.js';
import { UserStatus } from '../Shared/constants/status.js';
import { signToken } from '../Shared/middlewares/auth.js';

export class UserController {
  constructor(private userService: UserService) {}

  public findAll = catchAsync(async (req: Request, res: Response) => {
    const { page, ...rest } = req.query as any; // ya validado por listUsersQuerySchema
    if (page) return res.status(200).json(await this.userService.findPage({ page, ...rest }));
    const users = await this.userService.findAll();
    res.status(200).json({ data: users });
  });

  public findById = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.findOne({ id: req.params.id as string });
    if (!user) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ data: user });
  });

  public findEmployeesByOwner = catchAsync(async (req: Request, res: Response) => {
    const status = req.query.status === UserStatus.BAJA ? UserStatus.BAJA : UserStatus.ACTIVO;
    const users = await this.userService.findEmployeesByOwner(req.params.ownerId as string, status);
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

  public updateEmployee = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.updateEmployee(req.params.ownerId as string, req.params.id as string, req.body);
    res.status(200).json({ message: 'Empleado actualizado exitosamente', data: user });
  });

  public reactivateEmployee = catchAsync(async (req: Request, res: Response) => {
    const user = await this.userService.reactivateEmployee(req.params.ownerId as string, req.params.id as string);
    res.status(200).json({ message: 'Empleado reactivado exitosamente', data: user });
  });

  public deleteEmployee = catchAsync(async (req: Request, res: Response) => {
    await this.userService.removeEmployee(req.params.ownerId as string, req.params.id as string);
    res.status(200).json({ message: 'Empleado dado de baja exitosamente' });
  });

  public update = catchAsync(async (req: Request, res: Response) => {
    const updatedUser = await this.userService.update({ id: req.params.id as string }, req.body);
    if (!updatedUser) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ message: 'Usuario actualizado exitosamente', data: updatedUser });
  });

  public reactivate = catchAsync(async (req: Request, res: Response) => {
    const reactivatedUser = await this.userService.reactivate({ id: req.params.id as string });
    if (!reactivatedUser) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ message: 'Usuario reactivado exitosamente', data: reactivatedUser });
  });

  public resetPassword = catchAsync(async (req: Request, res: Response) => {
    if (!(await this.userService.resetPassword(req.params.id as string, req.body.password))) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ message: 'Contraseña restablecida: el usuario la cambia al iniciar sesión' });
  });

  public updatePassword = catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const success = await this.userService.updatePassword(req.params.id as string, currentPassword, newPassword);
    if (!success) throw new AppError('Contraseña actual incorrecta', 400);
    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  });

  public delete = catchAsync(async (req: Request, res: Response) => {
    const deleted = await this.userService.remove({ id: req.params.id as string });
    if (!deleted) throw new AppError('Usuario no encontrado', 404);
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  });

  public login = catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await this.userService.login(email, password);
    res.status(200).json({ data: user, token: signToken(user.id) });
  });
}