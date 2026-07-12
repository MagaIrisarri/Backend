const users = []; // En memoria (reemplazar con BD)
export class UserRepository {
    findAll() {
        return users;
    }
    findOne(item) {
        return users.find((user) => user.id === item.id);
    }
    add(item) {
        users.push(item);
        return item;
    }
    update(item) {
        const userIndex = users.findIndex(user => user.id === item.id);
        if (userIndex >= 0) {
            users[userIndex] = { ...users[userIndex], ...item };
        }
        return users[userIndex];
    }
    remove(item) {
        const userIndex = users.findIndex((user) => user.id === item.id);
        if (userIndex >= 0) {
            users.splice(userIndex, 1);
            return { id: item.id };
        }
        else {
            return undefined;
        }
    }
    findOneForEmail(email) {
        return users.find((user) => user.email === email);
    }
}
//# sourceMappingURL=UserRepository.js.map