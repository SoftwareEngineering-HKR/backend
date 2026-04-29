import RoomModel from '../../src/model/RoomModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import { expect } from "chai";
import sinon from "sinon";

describe("RoomModel", function() {
    let querystub;
    let emitstub;

    afterEach(() => {
        if(querystub) sinon.restore();
    });

    it("getRoom function", async ()=> {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves({
                rows: [{ name: "name" }]
            });

        const result = await RoomModel.getRoom("1");
        expect(result).to.deep.equal({ name: "name" });
        expect(querystub.calledOnce).to.be.true;
       
    })
    it("getRoom - throws if room does not exist", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: [] });

        try {
            await RoomModel.getRoom("1");
            throw new Error("Should have thrown");
        } catch (err) {
            expect(err.message).to.equal("No room with that id was found.");
        }
   });
   it("setRoom - should insert and return room", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves({
            rows: [{ id: "1", name: "Kitchen" }]
        });

        const result = await RoomModel.setRoom("Kitchen");

        expect(result).to.deep.equal({ id: "1", name: "Kitchen" });
        expect(querystub.calledOnce).to.be.true;
    });
    it("setRoom - should throw if insert fails", async () => {
        sinon.stub(DatabaseService, "query").resolves({ rows: [] });

        try {
            await RoomModel.setRoom("Kitchen");
            throw new Error("should fail");
        } catch (e) {
            expect(e.message).to.equal("Error adding the room.");
        }
    });
    it("updateRoom - should return true if update succeeds", async () => {
        sinon.stub(DatabaseService, "query").resolves({ rowCount: 1 });

        const result = await RoomModel.updateRoom("1", "Kitchen");

        expect(result).to.equal(true);
    });

    it("updateRoom - should return false if no row updated", async () => {
        sinon.stub(DatabaseService, "query").resolves({ rowCount: 0 });

        const result = await RoomModel.updateRoom("1", "Kitchen");

        expect(result).to.equal(false);
    });
})