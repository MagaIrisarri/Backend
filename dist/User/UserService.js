import { User } from "./UserEntity.js";
export class UserService {
    constructor(repo) {
        this.repo = repo;
    }
    findAll() {
        return this.repo.findAll();
    }
    findOne(id) {
        return this.repo.findOne({ id });
    }
    add(input) {
        const userNew = new User(input.dni, input.last_name, input.name, input.date_of_brthdate, input.email, input.phone, input.password, input.file, input.type);
        const user = this.repo.findOneForEmail(input.email);
        if (!user) {
            this.repo.add(userNew);
            return userNew;
        }
        ;
    }
    update(id, input) {
        return this.repo.update({ id, ...input });
    }
    remove(id) {
        return this.repo.remove({ id });
    }
    login(email, password) {
        const user = this.repo.findOneForEmail(email);
        if (user) {
            if (user.email === email && user.password === password) {
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
            }
        }
        else
            return;
    }
}
//# sourceMappingURL=UserService.js.map