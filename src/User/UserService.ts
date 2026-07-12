import { User } from "./UserEntity.js";
import { UserRepository } from "./UserRepository.js";

export class UserService {
    constructor(private repo: UserRepository) { }

    findAll(): User[] | undefined {
        return this.repo.findAll();
    }

    findOne(id: string): User | undefined {
        return this.repo.findOne({ id });
    }

    add(input: Omit<User, "id">): User | undefined {
        const userNew = new User(
          input.dni,  
          input.last_name,  
          input.name,  
          input.date_of_brthdate, 
          input.email, 
          input.phone,
          input.password,  
          input.file, 
          input.type,
        );
        const user = this.repo.findOneForEmail (input.email);
        if(!user){
            this.repo.add(userNew);
            return userNew;};
    }

    update(id: string, input: Partial<User>): User | undefined {
        return this.repo.update({ id, ...input } as User);
    }

    remove(id: string): { id: string } | undefined {
        return this.repo.remove({ id });
    }

    login(email: string, password: string): Omit<User, "password">  | undefined {
        const user = this.repo.findOneForEmail (email);
        if (user){
            if (user.email === email && user.password === password){
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
        }}
        else return;
    }
}


