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
        const user = new User(input.dni, input.last_name, input.name, input.date_of_brthdate, input.email, input.phone, input.password, input.file, input.type);
        this.repo.add(user);
        return user;
    }
    update(id, input) {
        return this.repo.update({ id, ...input });
    }
    remove(id) {
        return this.repo.remove({ id });
    }
}
//# sourceMappingURL=UserService.js.map