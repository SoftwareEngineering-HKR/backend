import { expect, use } from "chai";
import UserModel from "../../src/model/UserModel.js";
import dbs from "../../src/service/DatabaseService.js";

describe("UserModel Integration Test", function () {
    const userId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
    const userName = "username";
    const pass = "pass";


    before(async () => {
        await dbs.connect();
    });

    beforeEach(async () => {
        await dbs.query("DELETE FROM users");
        await dbs.query(
            "INSERT INTO users (id, username, password) VALUES ($1, $2, $3)",
            [userId, userName, pass]
        );
    });
    after(async () => {
        await dbs.query(
            "DELETE FROM users WHERE id = $1", [userId]);
        });


    it("getAllUsers - Gets all users", async () => {
        const result = await UserModel.getAllUsers();

        expect(result.length).to.equal(1);
        expect(result[0].id).to.equal(userId);
        expect(result[0].username).to.equal(userName);
    });

    it("getUserById - Get  user by id", async () => {
        const result = await UserModel.getUserById(userId);

        expect(result.username).to.equal(userName);
    });

    it("addUser - inserts user and returns full user", async () => {
        const username = "testUser";
        const password = "plainPassword";

        const result = await UserModel.addUser(username, password);

    
        expect(result).to.have.property("id");
        expect(result.username).to.equal(username);

        const rows = await dbs.query(
            "SELECT * FROM users WHERE id = $1",
            [result.id]
        );

        expect(rows.length).to.equal(1);

        expect(rows[0].password).to.not.equal(password);
        expect(rows[0].type).to.equal("user");
    });
    it("setUserRole - update the user to the corrct role user to admin", async () => {
        const newRole = "admin";

        const result = await UserModel.setUserRole(userName, newRole);

        expect(result).to.equal(true);

        const rows = await dbs.query(
            "SELECT type FROM users WHERE username = $1",
            [userName]
        );
        expect(rows).to.not.equal(newRole);
    });
    it("login - logins the user correctly", async () => {
        const newUsername = "newUser";
        const newPassword = "password"
        await UserModel.addUser(newUsername, newPassword)

        const result = await UserModel.login(newUsername, newPassword);

        expect(result).to.not.equal(null);

        expect(result.id).to.exist;
        expect(result.password).to.not.equal(newPassword);

    });
    it("deleteUser - delete a user correctly", async () => {
        const newUsername = "newUser";
        const newPassword = "password"
        await UserModel.addUser(newUsername, newPassword)

        const result = await UserModel.deleteUser(newUsername)

        expect(result).to.equal(true);

    });
    it("updatePassword - updates the password correctly", async () => {
        const username = "testUser";
        const oldPassword = "oldPass";
        const newPassword = "newPass";

        // create real user with hashed password
        await UserModel.addUser(username, oldPassword);

        // update password
        const updated = await UserModel.updatePassword(
            username,
            oldPassword,
            newPassword
        );

        expect(updated).to.equal(true);

        // old password should fail
        try {
            await UserModel.login(username, oldPassword);
            throw new Error("Old password should not work");
        } catch (err) {
            expect(err.message).to.equal("Invalid username or password.");
        }

        // new password should work
        const user = await UserModel.login(username, newPassword);

        expect(user).to.not.equal(null);
        expect(user.id).to.exist;
    });

});