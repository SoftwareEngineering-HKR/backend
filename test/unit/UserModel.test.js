import UserModel from '../../src/model/UserModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import jwt from "../../src/middleware/jwt.js"
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
        querystub = sinon.stub(DatabaseService, "query").resolves({
            rows: { id: 1, username: "test" }
        });

        const result = await UserModel.getAllUsers();
        expect(result).to.deep.equal({  id: 1, username: "test" });
    });
    it("getUserByName function", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves({
        rowCount: 1,
        rows: [{ id: 1 }]
    });
        const result = await UserModel.getUserByName("testUser");
        expect(result).to.equal(1);
    });

    it("getUserByName returns null if not found", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves({
            rowCount: 0,
            rows: []
        });

    const result = await UserModel.getUserByName("testUser");

    expect(result).to.equal(null);
    });

    it("updateUserName function", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves({
                rowCount: 1,
            });

        const result = await UserModel.updateUserName(1,"testUser");

        expect(result).to.equal(true);
    });
    it("deleteUser function", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves({
                rowCount: 1,
            });

        const result = await UserModel.deleteUser(1);

        expect(result).to.equal(true);
    });
});