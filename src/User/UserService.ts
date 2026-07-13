import { User } from "./UserEntity.js";
import { UserRepository } from "./UserRepository.js";
import argon2 from 'argon2';

export class UserService {
    constructor(private repo: UserRepository) { }

    findAll(): User[] | undefined {
        return this.repo.findAll();
    }

    findOne(id: string): User | undefined {
        return this.repo.findOne({ id });
    }

    async add(input: Omit<User, "id">): Promise<User | undefined> {
        const hashedPassword = await argon2.hash(input.password);
        const userNew = new User(
          input.dni,
          input.last_name,
          input.name,
          input.date_of_brthdate,
          input.email,
          input.phone,
          hashedPassword,
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

    async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<User | undefined> {
        const user = this.repo.findOne({ id });
        if (!user) return undefined;

        const passwordMatches = await argon2.verify(user.password, currentPassword);
        if (!passwordMatches) return undefined;

        const passworNewSame =  await argon2.verify(newPassword, currentPassword);
        if (!passworNewSame) return undefined;

        const hashedPassword = await argon2.hash(newPassword);
        return this.repo.update({ id, password: hashedPassword } as User);
    }

    remove(id: string): { id: string } | undefined {
        return this.repo.remove({ id });
    }

    async login(email: string, password: string): Promise<Omit<User, "password"> | undefined> {
        const user = this.repo.findOneForEmail (email);
        if (user){
            const passwordMatches = await argon2.verify(user.password, password);
            if (user.email === email && passwordMatches){
                const { password, ...userWithoutPassword } = user;
                return userWithoutPassword;
        }}
        else return;
    }
}


