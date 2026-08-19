import { Request, Response } from 'express';
import { UserRepository } from "./UserRepository.js";
import { UserService } from "./UserService.js";

const service = new UserService(new UserRepository());

export const findAll = (req: Request, res: Response) => {
    res.json(service.findAll());
}

export const findOne = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = service.findOne(id);

    if (!user)
        return res.status(404).send({ message: "User not found" });

    return res.json(user);
}

export const findEmployeesByOwner = (req: Request, res: Response) => {
    const ownerId = req.params.ownerId as string
    res.json(service.findEmployeesByOwner(ownerId));
}

export const addPublicUser = async (req: Request, res: Response) => {
    const user = await service.addPublicUser(req.body.sanitizedUserInput);

    if (!user)
        return res.status(404).send({ message: "User not found" });

    return res.json(user);
}

export const addEmployee = async (req: Request, res: Response) => {
    const ownerId = req.params.ownerId as string
    const user = await service.addPEmployee(req.body.sanitizedUserInput, ownerId);

    if (!user)
        return res.status(404).send({ message: "User not found" });

    return res.json(user);
}

export const update = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const user = service.update(id, req.body.sanitizedUserInput);

    if (!user)
        return res.status(404).send({ message: "User not found" });

    res.json({ message: "User updated successfully", data: user });
}

export const updatePassword = async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const currentPassword = req.body.currentPassword as string;
    const newPassword = req.body.newPassword as string;

    const user = await service.updatePassword(id, currentPassword, newPassword);

    if (!user)
        return res.status(400).send({ message: "Contraseña actual incorrecta o usuario no encontrado" });

    return res.json({ message: "Password updated successfully" });
}

export const remove = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = service.remove(id);

    if (!result)
        
        return res.status(500).json({ message: "There was an internal error deleting the user" })

    return res.json({ message: `User with id: ${result.id} successfully deleted` })
}

export const findOneForEmail = async (req: Request, res: Response) => {
    const email = req.body.email as string;
    const password = req.body.password as string;
    const user = await service.login(email, password);

    if ("error" in user){
        if (user.error === "not found")
            {return res.status(404).send({ message: "User not found" });}
        if (user.error === "user not ACTIVO") 
           { return res.status(401).send({ message: "El usuario no esta activo" });}
        if (user.error === "password incorrect") 
           { return res.status(401).send({ message: "Contraseña incorrecta" });}
    }
    else return res.json(user);
}
