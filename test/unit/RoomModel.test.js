import RoomModel from "../../src/model/RoomModel.js";
import DatabaseService from "../../src/service/DatabaseService.js";
import DeviceModel from "../../src/model/DeviceModel.js";

import { expect } from "chai";
import sinon from "sinon";

describe("RoomModel", function () {
    let querystub;

    afterEach(() => {
        sinon.restore();
    });

    it("getRoom function", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([{ name: "name" }]);

        const result = await RoomModel.getRoom("1");

        expect(result).to.deep.equal({ name: "name" });
        expect(querystub.calledOnce).to.be.true;
    });

    it("getRoom - throws if room does not exist", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves({ rows: [] });

        try {
            await RoomModel.getRoom("1");
            throw new Error("Should have thrown");
        } catch (err) {
            expect(err.message).to.equal(
                "No room with that id was found."
            );
        }
    });

    it("setRoom - should insert and return room", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([{ id: "1", name: "Kitchen" }]);

        const result = await RoomModel.setRoom("Kitchen");

        expect(result).to.deep.equal({
            id: "1",
            name: "Kitchen"
        });

        expect(querystub.called).to.be.true;
    });

    it("setRoom - should throw if insert fails", async () => {
        sinon.stub(DatabaseService, "query")
            .resolves({ rows: [] });

        try {
            await RoomModel.setRoom("Kitchen");
            throw new Error("Should fail");
        } catch (err) {
            expect(err.message).to.equal(
                "Error adding the room."
            );
        }
    });

    it("updateRoom - should return true if update succeeds", async () => {
        const roomId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
        const devicestub = sinon.stub(DeviceModel, "getAllDevices");
        devicestub.resolves([{id: "1", name: "name1", description: "newDescription"}])

        sinon.stub(DatabaseService, "query")
            .resolves({ length: 1 });

        const result = await RoomModel.updateRoom(
            roomId,
            "Kitchen"
        );

        expect(result).to.equal(true);
    });

    it("updateRoom - should return false if no row updated", async () => {
        const roomId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
        const devicestub = sinon.stub(DeviceModel, "getAllDevices");
        devicestub.resolves([{id: "1", name: "name1", description: "newDescription"}])
        sinon.stub(DatabaseService, "query")
            .resolves({ rowCount: 0 });

        const result = await RoomModel.updateRoom(
            roomId,
            "Kitchen"
        );

        expect(result).to.equal(false);
    });

    it("deleteRoom - deletes room successfully", async () => {
        querystub = sinon.stub();

        querystub.withArgs("BEGIN").resolves();

        querystub.withArgs(
            "DELETE FROM rooms WHERE id = $1 RETURNING id",
            ["b42410ee-132f-42ee-9e4f-09a6485c95b8"]
        ).resolves({
            rowCount: 1,
            rows: [
                {
                    id: "b42410ee-132f-42ee-9e4f-09a6485c95b8"
                }
            ]
        });

        querystub.withArgs("COMMIT").resolves();

        const releasestub = sinon.stub();

        const fakeClient = {
            query: querystub,
            release: releasestub
        };

        sinon.stub(DatabaseService.db, "connect")
            .resolves(fakeClient);

        sinon.stub(DeviceModel, "deleteDeviceRoomID")
            .resolves(["device1"]);

        sinon.stub(RoomModel, "getAllRooms")
            .resolves([]);

        sinon.stub(RoomModel, "emit");

        sinon.stub(DeviceModel, "getAllDevices")
            .resolves([]);

        sinon.stub(DeviceModel, "emit");

        const result = await RoomModel.deleteRoom(
            "b42410ee-132f-42ee-9e4f-09a6485c95b8"
        );

        expect(result).to.equal(true);

        expect(querystub.calledWith("BEGIN")).to.be.true;
        expect(querystub.calledWith("COMMIT")).to.be.true;

        expect(releasestub.calledOnce).to.be.true;
    });

    it("deleteRoom - rolls back transaction on failure", async () => {
        querystub = sinon.stub();

        querystub.withArgs("BEGIN").resolves();
        querystub.withArgs("ROLLBACK").resolves();

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

        expect(querystub.calledWith("ROLLBACK")).to.be.true;

        expect(releasestub.calledOnce).to.be.true;
    });
});