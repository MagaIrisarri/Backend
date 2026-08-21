import { Request, Response } from 'express';
import { UserService } from './User.Service.js';

export class UserController {
  constructor(private userService: UserService) {}

  public findAll = async (req: Request, res: Response) => {
    try {
      const users = await this.userService.findAll();
      res.status(200).json({ data: users });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
  };

  public findById = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.findOne({ id: req.params.id as string });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ data: user });
    } catch (error: any) {
      res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
  };

  public create = async (req: Request, res: Response) => {
    try {
      const user = await this.userService.add(req.body);
      res.status(201).json({ message: 'User created successfully', data: user });
    } catch (error: any) {
      res.status(500).json({ message: 'Error creating user', error: error.message });
    }
  };

  public update = async (req: Request, res: Response) => {
    try {
      const updatedUser = await this.userService.update({ id: req.params.id as string }, req.body);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User updated successfully', data: updatedUser });
    } catch (error: any) {
      res.status(500).json({ message: 'Error updating user', error: error.message });
    }
  };

  public delete = async (req: Request, res: Response) => {
    try {
      const deleted = await this.userService.remove({ id: req.params.id as string });
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.status(200).json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
  };
}