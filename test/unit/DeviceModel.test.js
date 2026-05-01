import DeviceModel from '../../src/model/DeviceModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import scale from '../../src/model/ScaleModel.js';
import { expect } from "chai";
import sinon from "sinon";

describe("DeviceModel", function() {
    let querystub;
    let scalestub;
    let emitstub;

    afterEach(() => {
        if(querystub) sinon.restore();
    });

    it("GetDevices - get all the devices id", async ()=> {
        const rows = [{ id: "1", id: "2" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves(rows);

        const result = await DeviceModel.getDevices();

        expect(result).to.deep.equal(rows);
        expect(querystub.calledOnce).to.be.true;
    });

    it("GetDevices - if no devices found", async()=>{
        const rows = [];

        querystub = sinon.stub(DatabaseService, "query")
        .resolves(rows);

        const result = DeviceModel.getDevices();

        expect(result).to.be.empty;

    });

    it("GetDevices - if no decvices found an error is thrown", async() => {
        const rows = [];

        querystub = sinon.stub(DatabaseService, "query")
        .resolves(rows);

        try {
            await DeviceModel.getDevices();
            expect.fail("Should throw an error if no devices is found.");
        } catch(error){
            expect(error.message).to.equal("No devices was found.");
        }
    });

    it("getDeviceInfo - getting information about a specific device", async() => {
        const rows = [{ "name": "lamp", "description": "lamp description", "type": "lamp" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves(rows );

        const result = await DeviceModel.getDeviceInfo(1);

        expect(result).to.deep.equal(rows[0]);
        expect(querystub.calledWith(sinon.match.string, [1])).to.be.true;
    });

    it("getDeviceInfo - if no devices with that id found", async () => {
        querystub = sinon.stub(DatabaseService, "query")
            .resolves([]);

        try {
            await DeviceModel.getDeviceInfo(1);
            expect.fail("Should throw error");
        } catch (error) {
            expect(error.message).to.equal("No device with that id was found.");
        }
    });


    it("setDevice - if a new device is set up properly", async()=>{
        querystub = sinon.stub(DatabaseService, "query");

        querystub.onCall(0).resolves();
        querystub.onCall(1).resolves({ row: [{ id: "1" }]});
        querystub.onCall(2).resolves();

        scalestub = sinon.stub(scale, "setValue").resolves("scale created");
        emitstub = sinon.stub(DeviceModel, "emit");

        const result = await DeviceModel.setDevice("1", "1", "speaker", true, "123", "SKitche", "Speaker in kitchen", "32", "100", "0");

        expect(result).to.equal('1');
        expect(querystub.firstCall.args[0]).to.equal("BEGIN");
        expect(querystub.secondCall.args[0]).to.match(/INSERT into devices/i);
        expect(querystub.thirdCall.args[0]).to.equal("COMMIT");

        expect(scalestub.calledOnceWithExactly("1", "32", "0", "100", DatabaseService)).to.be.true;
        expect(emitstub.calledOnceWithExactly("newDevice", {id: "1", scaleResult: "scale created"})).to.be.true;

    });


    it("setDevice - checking if ROLLBACK occurs and throws error", async () => {
        const testError = new Error("Scale failes");
    
        querystub = sinon.stub(DatabaseService, "query");

        querystub.onCall(0).resolves();
        querystub.onCall(1).resolves();
        querystub.onCall(2).resolves();
    
        scalestub = sinon.stub(scale, "setValue").rejects(testError);
    
        try {
            await DeviceModel.setDevice(
                "1", "1", "speaker", true, "123",
                "SKitche", "Speaker in kitchen", "32", "100", "0"
            );
            throw new Error("Test failed: expected method to throw");
        } catch (error) {
            expect(error).to.equal(testError);
            expect(scalestub.calledOnce).to.be.true;
            expect(querystub.thirdCall.args[0]).to.equal("ROLLBACK");
        }
    });

    it("initDevice - check so a device is initiated", async()=> {
        querystub = sinon.stub(DatabaseService, "query");
        querystub.resolves({ row: [{ ip: "1", mac: "1" }]});

        await DeviceModel.initDevice("1", "1");

        expect(querystub.firstCall).to.match(/INSERT into devices/i);
        expect(querystub.calledOnce).to.be.true;

    });

    it("updateDevice - if a device gets properly updated", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");
        querystub.resolves({length: 1});

        emitstub = sinon.stub(DeviceModel, "emit");

        const result = await DeviceModel.updateDevice("1", "name", "description");

        expect(result).to.equal(true);
        expect(querystub.firstCall).to.match(/UPDATE devices SET/i);
        expect(emitstub.calledOnceWithExactly("updateDevice", {id: "1", name: "name", description: "description"})).to.be.true;
    });

    it("deleteDevice - if a device gets deleted", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");
        querystub.resolves({length: 1});

        const result = await DeviceModel.deleteDevice("1");

        expect(result).to.equal(true);
        expect(querystub.firstCall).to.match(/DELETE FROM devices WHERE id = /i);
    });

    it("updateValue - if a value gets updated", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");
        sinon.stub(DeviceModel, "getDeviceInfo")
        .resolves({ type: "lamp" });

        const emitstub = sinon.stub(DeviceModel, "emit");


        const scalestub = sinon.stub(scale, "updateValue");
        scalestub.resolves({ deviceID : "1" })

        const result = await DeviceModel.updateValue("1", "2");

        expect(emitstub.calledOnceWithExactly("updateValue", { id: "1", value: "2" })).to.be.true;  
        expect(scalestub.calledOnce).to.be.true;

    });

    it("if a device status gets updates", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");
        emitstub = sinon.stub(DeviceModel, "emit");

        querystub.resolves({online: true, length: 1})

        const result = await DeviceModel.updateDeviceStatus("1", false);
        expect(result).to.equal(true);
        expect(emitstub.calledOnceWithExactly("OnlineStateUpdate", {id: "1", online: true}))
    });

    it("if a device exists returns true", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");

        querystub.resolves({length: 1})

        const result = await DeviceModel.checkIfDeviceExists("1");
        expect(result).to.equal(true);
    });

    it("if a device does not exists returns false", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");
        emitstub = sinon.stub(DeviceModel, "emit");

        querystub.resolves({length: 0})

        const result = await DeviceModel.updateDeviceStatus("1");

        expect(result).to.equal(false);
    });

    it("if a devices gets by ids works", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");

        const rows = ["1", "2"]

        querystub.resolves( rows );

        const result = await DeviceModel.getDevicesByIDs(rows);

        expect(result).to.deep.equal(rows);

    });

    it("if a devices gets by ids works, when nothing is in the list", async()=>  {
        querystub = sinon.stub(DatabaseService, "query");

        const rows = []

        querystub.resolves( rows );

        const result = await DeviceModel.getDevicesByIDs([""]);

        expect(result).to.equal(rows);
    });


})