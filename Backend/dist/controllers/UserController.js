const users = []; // En memoria (reemplazar con BD)
export const createUser = (req, res) => {
    const newUser = { ...req.body };
    users.push(newUser);
    res.status(201).json(newUser);
};
export const getUsers = (req, res) => {
    res.status(200).json(users);
};
export const getUserDNI = (req, res) => {
    const dni = parseInt(req.params['dni']);
    const user = users.find(u => u.dni === dni);
    if (!user) {
        res.status(404).json({ mensaje: 'User no encontrada' });
        return;
    }
    res.status(200).json(user);
};
export const updateUser = (req, res) => {
    const dni = parseInt(req.params['dni']);
    const userIndex = users.findIndex(u => u.dni === dni);
    if (userIndex === -1) {
        res.status(404).json({ mensaje: 'Usuario no encontrado' });
        return;
    }
    users[userIndex] = { ...users[userIndex], ...req.body, dni }; // Preserve original DNI
    res.status(200).json(users[userIndex]);
};
export const deleteUser = (req, res) => {
    const dni = parseInt(req.params['dni']);
    const user = users.findIndex(u => u.dni === dni);
    if (user === -1) {
        res.status(404).json({ mensaje: 'Usuario no encontrada' });
        return;
    }
    users.splice(user, 1);
    res.status(204).send();
};
//# sourceMappingURL=UserController.js.map