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

export const add = (req: Request, res: Response) => {
    const user = service.add(req.body.sanitizedUserInput);

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

export const remove = (req: Request, res: Response) => {
    const id = req.params.id as string;
    const result = service.remove(id);

    if (!result)
        return res.status(500).json({ message: "There was an internal error deleting the user" })

    return res.json({ message: `User with id: ${result.id} successfully deleted` })
}

export const findOneForEmail = (req: Request, res: Response) => {
    const email = req.body.email as string;
    const password = req.body.password as string;
    const user = service.login(email, password);

    if (!user)
        return res.status(404).send({ message: "User not found" });

    return res.json(user);
}
