const vehicleTypes = [];
export const createVehicleType = (req, res) => {
    const newVehicleType = { ...req.body };
    vehicleTypes.push(newVehicleType);
    res.status(201).json(newVehicleType);
};
export const getVehicleTypes = (req, res) => {
    res.status(200).json(vehicleTypes);
};
export const getVehicleTypeCode = (req, res) => {
    const code = parseInt(req.params['code']);
    const vehicleType = vehicleTypes.find(vt => vt.code === code);
    if (!vehicleType) {
        res.status(404).json({ mensaje: 'vehicle type not found' });
        return;
    }
    res.status(200).json(vehicleType);
};
export const updateVehicleType = (req, res) => {
    const code = parseInt(req.params['code']);
    const vtIndex = vehicleTypes.findIndex(vt => vt.code === code);
    if (vtIndex === -1) {
        res.status(404).json({ mensaje: 'vehicle type not found' });
        return;
    }
    vehicleTypes[vtIndex] = { ...vehicleTypes[vtIndex], ...req.body, code };
    res.status(200).json(vehicleTypes[vtIndex]);
};
export const deleteVehicleType = (req, res) => {
    const code = parseInt(req.params['code']);
    const vtIndex = vehicleTypes.findIndex(vt => vt.code === code);
    if (vtIndex === -1) {
        res.status(404).json({ mensaje: 'vehicle type not found' });
        return;
    }
    vehicleTypes.splice(vtIndex, 1);
    res.status(204).send();
};
//# sourceMappingURL=vehicleTypeController.js.map