import { Repository } from "../Shared/base.Repository.js";
import { User } from './UserEntity.js';

const users: User[] = []; // En memoria (reemplazar con BD)

export class UserRepository implements Repository<User> {

    public findAll(): User[] | undefined {
        return users;
    }

    public findOne(item: { id: string; }): User | undefined {
        return users.find((user) => user.id === item.id);
    }

    public add(item: User): User | undefined {
        users.push(item);
        return item;
    }

    public update(item: User): User | undefined {
        const userIndex = users.findIndex(user => user.id === item.id);

        if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...item }
        }

        return users[userIndex];
    }

    public remove(item: { id: string; }): { id: string } | undefined {
        const userIndex = users.findIndex((user) => user.id === item.id);

        if (userIndex >= 0) {
            users.splice(userIndex, 1);
            return { id: item.id }
        }
        else {
            return undefined;
        }

    }

}