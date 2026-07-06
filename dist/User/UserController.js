import { UserRepository } from "./UserRepository.js";
import { UserService } from "./UserService.js";
const service = new UserService(new UserRepository());
export const findAll = (req, res) => {
    res.json(service.findAll());
};
export const findOne = (req, res) => {
    const id = req.params.id;
    const user = service.findOne(id);
    if (!user)
        return res.status(404).send({ message: "User not found" });
    return res.json(user);
};
export const add = (req, res) => {
    const user = service.add(req.body.sanitizedUserInput);
    return res.status(201).json({ message: "User added", data: user });
};
export const update = (req, res) => {
    const id = req.params.id;
    const user = service.update(id, req.body.sanitizedUserInput);
    if (!user)
        return res.status(404).send({ message: "User not found" });
    res.json({ message: "User updated successfully", data: user });
};
export const remove = (req, res) => {
    const id = req.params.id;
    const result = service.remove(id);
    if (!result)
        return res.status(500).json({ message: "There was an internal error deleting the user" });
    return res.json({ message: `User with id: ${result.id} successfully deleted` });
};
//# sourceMappingURL=UserController.js.map