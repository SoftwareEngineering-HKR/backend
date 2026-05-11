import UserModel from '../../src/model/UserModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import jwt from "../../src/middleware/JwtService.js"
import { expect } from "chai";
import sinon from "sinon";
import bcrypt from "bcrypt";

describe("USerModel", function() {
    let querystub;
    let bcryptstub;
    let bcryptComparestub;

    afterEach(() => {
        if(querystub) sinon.restore();
    });

    it("getAllUsers function", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves({ id: 1, username: "test" }
        );

        const result = await UserModel.getAllUsers();
        expect(result).to.deep.equal({  id: 1, username: "test" });

    });

    it("getUserByName returns null if not found", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves([]);

    const result = await UserModel.getUserByName("testUser");

    expect(result).to.equal(null);
    });

    it("getUserById - Get a specific user from the database based on the id.", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves([{ id: 1, username: "test", type: "user" }]);

        const result = await UserModel.getUserById(1);
        expect(result).to.deep.equal({  id: 1, username: "test", type: "user" });

    });
    it("updateUserName function", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves({
                length: 1,
            });

        const result = await UserModel.updateUserName(1,"testUser");

        expect(result).to.equal(true);
    });
    it("deleteUser function", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves({
                length: 1,
            });

        const result = await UserModel.deleteUser(1);

        expect(result).to.equal(true);
    });

    it("getUserPassword", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([{
                password: "hashed_pass",
            }]);

        const result = await UserModel.getUserPassword(1);

        expect(result).to.equal("hashed_pass");
    });

    it("addUser - user", async () => {
        const user = {id: "1", username: "test", type: "user"}
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([user]);

        const result = await UserModel.addUser("test", "pass");

        expect(result).to.equal(user);
    });

    it("addUser - admin", async () => {
        const user = {id: "1", username: "test", type: "admin"}
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([user]);

        const result = await UserModel.addUser("test", "pass", "admin");

        expect(result).to.equal(user);
    });

    it("updatePassword - updates password when old password is correct", async () => {
        const getUserByNameStub = sinon.stub(UserModel, "getUserByName").resolves(1);
        const getUserPasswordStub = sinon.stub(UserModel, "getUserPassword").resolves("hashed_old");

        const compareStub = sinon.stub(bcrypt, "compare").resolves(true);
        const hashStub = sinon.stub(bcrypt, "hash").resolves("hashed_new");

        querystub = sinon.stub(DatabaseService, "query").resolves([{}]);

        const result = await UserModel.updatePassword("testUser", "plain_old", "plain_new");

        expect(result).to.equal(true);

        // Optional but important verification
        expect(compareStub.calledWith("plain_old", "hashed_old")).to.be.true;
        expect(hashStub.calledWith("plain_new", 10)).to.be.true;
        expect(querystub.calledOnce).to.be.true;

    });

    it("updatePassword - throws if old password is incorrect", async () => {
        sinon.stub(UserModel, "getUserByName").resolves(1);
        sinon.stub(UserModel, "getUserPassword").resolves("hashed_old");

        sinon.stub(bcrypt, "compare").resolves(false); // key difference

        try {
            await UserModel.updatePassword("testUser", "wrong_pass", "new_pass");
            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.message).to.equal("Wrong password!");
        }

    });
    it("updatePassword - returns false if update did not affect any rows", async () => {
        sinon.stub(UserModel, "getUserByName").resolves(1);
        sinon.stub(UserModel, "getUserPassword").resolves("hashed_old");

        sinon.stub(bcrypt, "compare").resolves(true);
        sinon.stub(bcrypt, "hash").resolves("hashed_new");

        querystub = sinon.stub(DatabaseService, "query").resolves([]); // no rows updated

        const result = await UserModel.updatePassword("testUser", "plain_old", "plain_new");

        expect(result).to.equal(false);

    });
    it("login - returns user when credentials are correct", async () => {
        const user = { id: 1, username: "test", password: "hashed_pw" };

        const getUserStub = sinon.stub(UserModel, "_getUser").resolves(user);
        const compareStub = sinon.stub(bcrypt, "compare").resolves(true);

        const result = await UserModel.login("test", "plain_pw");

        expect(result).to.deep.equal(user);

        expect(compareStub.calledWith("plain_pw", "hashed_pw")).to.be.true;

    });
    it("login - throws if password is incorrect", async () => {
        const user = { id: 1, username: "test", password: "hashed_pw" };

        sinon.stub(UserModel, "_getUser").resolves(user);
        sinon.stub(bcrypt, "compare").resolves(false);

        try {
            await UserModel.login("test", "wrong_pw");
            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.message).to.equal("Invalid username or password.");
        }

    });
    it("login - throws if user does not exist", async () => {
        const getUserStub = sinon.stub(UserModel, "_getUser").resolves(null);

        const compareStub = sinon.stub(bcrypt, "compare");

        try {
            await UserModel.login("unknown", "pw");
            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.message).to.equal("Invalid username or password.");
        }

        // Important: bcrypt.compare should NOT be called
        expect(compareStub.notCalled).to.be.true;

    });
    it("setUserRole - to admin", async() => {
        querystub = sinon.stub(DatabaseService, "query").resolves({length: 1})

        const result = await UserModel.setUserRole("user", "admin")

        expect(result).to.deep.equal(true)
    });
});