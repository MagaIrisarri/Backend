export const sanitizeUserInput = (req, res, next) => {
    req.body.sanitizedUserInput = {
        dni: req.body.dni,
        name: req.body.name,
        last_name: req.body.last_name,
        date_of_brthdate: req.body.date_of_brthdate,
        email: req.body.email,
        phone: req.body.phone,
        password: req.body.password,
        file: req.body.file,
        type: req.body.type,
    };
    Object.keys(req.body.sanitizedUserInput).forEach((key) => {
        if (req.body.sanitizedUserInput[key] === undefined) {
            delete req.body.sanitizedUserInput[key];
        }
    });
    next();
};
//# sourceMappingURL=UserValidations.js.map