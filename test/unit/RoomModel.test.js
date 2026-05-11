import RoomModel from '../../src/model/RoomModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import DeviceModel from '../../src/model/DeviceModel.js';
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
            .resolves([{ name: "name" }]
            );

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
        .resolves([{ id: "1", name: "Kitchen" }]
        );

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

        const roomId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
        sinon.stub(DatabaseService, "query").resolves({ length: 1 });

        const result = await RoomModel.updateRoom(roomId, "Kitchen");

        expect(result).to.equal(true);
    });

    it("updateRoom - should return false if no row updated", async () => {
    const roomId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
        sinon.stub(DatabaseService, "query").resolves({ rowCount: 0 });

        const result = await RoomModel.updateRoom(roomId, "Kitchen");

        expect(result).to.equal(false);
    });
    
    it("deleteRoom - deletes room successfully", async () => {
        querystub = sinon.stub();

        querystub.onCall(0).resolves();
        querystub.onCall(1).resolves({
            rowCount: 1, 
            rows: [{ id: "b42410ee-132f-42ee-9e4f-09a6485c95b8" }]});
        querystub.onCall(2).resolves();

        const releasestub = sinon.stub();

        const fakeClient = {
            query: querystub,
            release: releasestub
        };

        sinon.stub(DatabaseService.db, "connect")
            .resolves(fakeClient);

        sinon.stub(DeviceModel, "deleteDeviceRoomID")
            .resolves([{ id: "device1" }]);

        const result = await RoomModel.deleteRoom(
            "b42410ee-132f-42ee-9e4f-09a6485c95b8"
        );

        expect(result).to.equal(true);

        expect(querystub.firstCall.args[0]).to.equal("BEGIN");

        expect(querystub.thirdCall.args[0]).to.equal("COMMIT");

        expect(releasestub.calledOnce).to.be.true;
    });

    it("deleteRoom - rolls back transaction on failure", async () => {
       querystub = sinon.stub();

        querystub.onFirstCall().resolves();
        querystub.onSecondCall().resolves();

        const releasestub = sinon.stub();

        const fakeClient = {
            query: querystub,
            release: releasestub
        };

        sinon.stub(DatabaseService.db, "connect")
            .resolves(fakeClient);

        sinon.stub(DeviceModel, "deleteDeviceRoomID")
            .rejects(new Error("DB failure"));

        try {
            await RoomModel.deleteRoom(
                "b42410ee-132f-42ee-9e4f-09a6485c95b8"
            );

            throw new Error("Expected error not thrown");
        } catch (err) {
            expect(err.message).to.equal("DB failure");
        }

        expect(querystub.secondCall.args[0]).to.equal("ROLLBACK");

        expect(releasestub.calledOnce).to.be.true;
});
})