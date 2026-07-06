import crypto from "node:crypto";
export class User {
    constructor(dni, last_name, name, date_of_brthdate, email, phone, password, file, type, id = crypto.randomUUID()) {
        this.dni = dni;
        this.last_name = last_name;
        this.name = name;
        this.date_of_brthdate = date_of_brthdate;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.file = file;
        this.type = type;
        this.id = id;
    }
}
//# sourceMappingURL=UserEntity.js.map