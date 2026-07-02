import { Request, Response } from 'express';
import { User } from '../User.ts';

const users: User[] = []; // En memoria (reemplazar con BD)

export const createUser = (req: Request, res: Response): void => {
  const newUser: User = { ...req.body };
  users.push(newUser);
  res.status(201).json(newUser);
};

export const getUsers = (req: Request, res: Response): void => {
  res.status(200).json(users);
};

export const getUserDNI = (req: Request, res: Response): void => {
  const dni = parseInt(req.params['dni'] as string);
  const user = users.find(u => u.dni === dni);

  if (!user) {
    res.status(404).json({ mensaje: 'User no encontrada' });
    return;
  }

  res.status(200).json(user);
};

export const updateUser = (req: Request, res: Response): void => {
  const dni = parseInt(req.params['dni'] as string);
  const userIndex = users.findIndex(u => u.dni === dni);

  if (userIndex === -1) {
    res.status(404).json({ mensaje: 'Usuario no encontrado' });
    return;
  }

  users[userIndex] = { ...users[userIndex], ...req.body, dni }; // Preserve original DNI
  res.status(200).json(users[userIndex]);
};

export const updateUserPartial = (req: Request, res: Response): void => {
  const dni = parseInt(req.params['dni'] as string);
  const index = users.findIndex(u => u.dni === dni);

  if (index === -1) {
    res.status(404).json({ mensaje: 'Usuario no encontrado' });
    return;
  }

  users[index] = { ...users[index], ...req.body }; // solo pisa los campos enviados
  res.status(200).json(users[index]);
};

export const deleteUser = (req: Request, res: Response): void => {
  const dni = parseInt(req.params['dni'] as string);
  const user = users.findIndex(u => u.dni === dni);

  if (user === -1) {
    res.status(404).json({ mensaje: 'Usuario no encontrada' });
    return;
  }

  users.splice(user, 1);
  res.status(204).send();
};
