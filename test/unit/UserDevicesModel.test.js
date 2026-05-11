import UserDeviceModel from '../../src/model/UserDevicesModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import DeviceModel from '../../src/model/DeviceModel.js';

import { expect } from "chai";
import sinon from "sinon";

describe("USerModel", function() {
    let querystub;

    afterEach(() => {
        if(querystub) sinon.restore();
    });

   it("getDevicesByUser - returns device ids for user", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves([
            { id: "device1" },
            { id: "device2" }
        ]);

        const result = await UserDeviceModel.getDevicesByUser("user123");

        expect(result).to.deep.equal(["device1", "device2"]);

    });
    it("getDevicesByUser - returns empty array if user has no devices", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves([]);

        const result = await UserDeviceModel.getDevicesByUser("user123");

        expect(result).to.deep.equal([]);

    });
    it("addUserToDevice - connects user to device", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([{ id_device: "device1" }]);

        const deviceStub = sinon.stub(DeviceModel, "getDevicesByIDs")
            .resolves([{ id: "device1", name: "Lamp" }]);

        const emitStub = sinon.stub(UserDeviceModel, "emit");

        const result = await UserDeviceModel.addUserToDevice(
            "user1",
            "device1"
        );

        expect(result).to.equal(true);

        expect(emitStub.calledOnce).to.be.true;

    });
    it("addUserToDevice - returns false if insert failed", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves([]);

        const deviceStub = sinon.stub(DeviceModel, "getDevicesByIDs")
            .resolves([{ id: "device1" }]);

        const emitStub = sinon.stub(UserDeviceModel, "emit");

        const result = await UserDeviceModel.addUserToDevice(
            "user1",
            "device1"
        );

        expect(result).to.equal(false);

        expect(emitStub.notCalled).to.be.true;

        sinon.restore();
    });
});