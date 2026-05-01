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


    it("getUserByName - get a specific user from the database based on the username.", async () => {

        const result = await UserModel.getUserByName(userName);

        expect(result).to.deep.equal(userId);
    });


    it("getAllUsers - Gets all users", async () => {
        const result = await UserModel.getAllUsers();

        expect(result.length).to.equal(1);
        expect(result[0].id).to.equal(userId);
        expect(result[0].username).to.equal(userName);
    });
    it("_getUser - Get a specific user from the database based on the username.", async () => {
        const result = await UserModel._getUser(userName);

        expect(result.id).to.equal(userId);
        expect(result.type).to.equal("user");
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

});