const Services = []; // En memoria (reemplazar con BD)
export const createService = (req, res) => {
    const newService = { ...req.body };
    Services.push(newService);
    res.status(201).json(newService);
};
export const getServices = (req, res) => {
    res.status(200).json(Services);
};
export const getServiceById = (req, res) => {
    const id = parseInt(req.params['id']);
    const Service = Services.find(s => s.id_service === id);
    if (!Service) {
        res.status(404).json({ mensaje: 'Servicio no encontrado' });
        return;
    }
    res.status(200).json(Service);
};
export const updateService = (req, res) => {
    const id = parseInt(req.params['id']);
    const ServiceIndex = Services.findIndex(s => s.id_service === id);
    if (ServiceIndex === -1) {
        res.status(404).json({ mensaje: 'Servicio no encontrado' });
        return;
    }
    Services[ServiceIndex] = { ...Services[ServiceIndex], ...req.body, id_Service: id };
    res.status(200).json(Services[ServiceIndex]);
};
export const deleteService = (req, res) => {
    const id = parseInt(req.params['id']);
    const ServiceIndex = Services.findIndex(s => s.id_service === id);
    if (ServiceIndex === -1) {
        res.status(404).json({ mensaje: 'Servicio no encontrado' });
        return;
    }
    Services.splice(ServiceIndex, 1);
    res.status(204).send();
};
//# sourceMappingURL=ServiceController.js.map