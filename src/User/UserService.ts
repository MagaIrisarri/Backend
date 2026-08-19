import { User } from "./UserEntity.js";
import { UserRepository } from "./UserRepository.js";
import argon2 from 'argon2';

export class UserService {
    constructor(private repo: UserRepository) { }

    findAll(): Omit<User, "password">[] | undefined{
        const users = this.repo.findAll();
        return users?.map(({ password, ...rest }) => rest);
    
    }

    findOne(id: string): Omit<User, "password"> | undefined {
        const user = this.repo.findOne({ id });
        if (!user){
            return undefined;
        }
        else{
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
    }

    async addPublicUser(input: Omit<User, "id">): Promise<User | undefined> {
        const hashedPassword = await argon2.hash(input.password);
        const status = "ACTIVO"
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
          status,
        );
        const user = this.repo.findOneForEmail (input.email);
        if(!user){
            this.repo.add(userNew);
            return userNew;};
    }

    async addPEmployee(input: Omit<User, "id">, ownerId: string): Promise<User | undefined> {
        const hashedPassword = await argon2.hash(input.password);
        const status = "ACTIVO"
        const type = "EMPLEADO"
        const userNew = new User(
          input.dni,
          input.last_name,
          input.name,
          input.date_of_brthdate,
          input.email,
          input.phone,
          hashedPassword,
          input.file,
          type,
          status,
          ownerId,
        );
        const user = this.repo.findOneForEmail (input.email);
        const ownerUser = this.repo.findOne({ id: ownerId });
        if(!user){
            if (ownerUser?.status === "ACTIVO" && ownerUser.type === "DUEÑO"){
                this.repo.add(userNew);
                return userNew;}
            };
    }

    update(id: string, input: Partial<User>): User | undefined {
        return this.repo.update({ id, ...input } as User);
    }

    async updatePassword(id: string, currentPassword: string, newPassword: string): Promise<User | undefined> {
        const user = this.repo.findOne({ id });
        if (!user) return undefined;

        const passwordMatches = await argon2.verify(user.password, currentPassword);
        if (!passwordMatches) return undefined;

        const isSameAsCurrent = await argon2.verify(user.password, newPassword);
        if (isSameAsCurrent) return undefined;

        const hashedPassword = await argon2.hash(newPassword);
        return this.repo.update({ id, password: hashedPassword } as User);
    }

    remove(id: string): { id: string } | undefined {
        return this.repo.remove({ id });
    }

    async login(email: string, password: string): Promise<Omit<User, "password"> | {error: string} >{{
        const user = this.repo.findOneForEmail (email);
        if (user){
            if (user.status === "ACTIVO"){
                const passwordMatches = await argon2.verify(user.password, password);
                if (passwordMatches){
                    const { password, ...userWithoutPassword } = user;
                    return userWithoutPassword;}
                else return {error: "password incorrect"}
            }
            else return {error: "user not ACTIVO"}}
        else return {error: "not found"};
        }
    }

    public findEmployeesByOwner(ownerId: string): Omit<User, "password">[] | undefined {
        const users = this.repo.findByOwner(ownerId);
        return users?.map(({ password, ...rest }) => rest);
    }


}
