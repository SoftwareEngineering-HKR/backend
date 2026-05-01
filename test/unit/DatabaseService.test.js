import DatabaseService from "../../src/service/DatabaseService.js";
import { expect } from "chai";
import sinon from "sinon";

describe("DatabaseService", function() {
    let queryStub;

    afterEach(() => {
        if (queryStub) queryStub.restore();
    });

    it("should return rows from the database", async () => {
        const rows = [{ id: 0, name: "test" }]; 
        
    
        queryStub = sinon.stub(DatabaseService.db, "query")
            .resolves({ rows: rows });
        
        const result = await DatabaseService.query("SELECT * FROM users");


        expect(result).to.deep.equal(rows);
        expect(queryStub.calledOnce).to.be.true;
    });

    it("should establish a connection to the database", async () => {
        const conSpy = sinon.spy(DatabaseService.db, "on");

        await DatabaseService.connect();

        expect(conSpy.calledWith("connect")).to.be.true;

        conSpy.restore();
    });

    it("when connectes should be logged in the console", async () => {
        const logSpy = sinon.spy(console, "log");

        let connectCallback;
        sinon.stub(DatabaseService.db, "on").callsFake((event, cb) => {
            if(event === "connect") connectCallback = cb;
        });

        await DatabaseService.connect();
        connectCallback();

        expect(logSpy.calledWith("Connected to PostgreSQL")).to.be.true;

        logSpy.restore();
        DatabaseService.db.on.restore();
    })

});