import { Repository } from "../Shared/base.Repository.js";
import { User } from "./User.Entity.js";

export class UserService {
    constructor(private repo: Repository<User>) { }

    findAll(): User[] | undefined {
        return this.repo.findAll();
    }

    findOne(id: string): User | undefined {
        return this.repo.findOne({ id });
    }

    add(input: Omit<User, "id">): User {
        const user = new User(
        
        );
        this.repo.add(user);
        return user;
    }

    update(id: string, input: Partial<User>): User | undefined {
        return this.repo.update({ id, ...input } as User);
    }

    remove(id: string): { id: string } | undefined {
        return this.repo.remove({ id });
    }
}