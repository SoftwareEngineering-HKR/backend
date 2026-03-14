import DeviceModel from '../../src/model/DeviceModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import { expect } from "chai";
import sinon from "sinon";

describe("DeviceModel", function() {
    let querystub;

    afterEach(() => {
        if(querystub) querystub.restore();
    });

    it("get all the devices id", async ()=> {
        const rows = [{ id: "1", id: "2" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = await DeviceModel.getDevices();

        expect(result).to.deep.equal(rows);
        expect(querystub.calledOnce).to.be.true;
    });

    it("if no devices found", async()=>{
        const rows = [];

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = DeviceModel.getDevices();

        expect(result).to.be.empty;

    });

    it("if no decvices found an error is thrown", async() => {
        const rows = [];

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        try {
            await DeviceModel.getDevices();
            expect.fail("Should throw an error if no devices is found.");
        } catch(error){
            expect(error.message).to.equal("No devices was found.");
        }
    });

    it("getting information about a specific device", async() => {
        const rows = [{ name: "lamp", description: "lamp description" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = await DeviceModel.getDeviceInfo(1);

        expect(result).to.deep.equal(rows[0]);
        expect(querystub.calledWith(sinon.match.string, [1])).to.be.true;
    });

    it("if no devices with that idfound", async()=>{
        const rows = [];

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = DeviceModel.getDeviceInfo(1);

        expect(result).to.be.empty;

    });

    it("if no decvices with that id is found an error is thrown", async() => {
        const rows = [];

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        try {
            await DeviceModel.getDeviceInfo(1);
            expect.fail("Should throw an error if no devices is found.");
        } catch(error){
            expect(error.message).to.equal("No device with that id was found.");
        }
    });

    it("if a new device is set up properly", async()=>{
        const rows = {id: "1" };

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows })

        const result = await DeviceModel.setDevice("1", "1", "speaker", true, "123", "SKitche", "Speaker in kitchen", "32", "100", "0")

        console.log("row", rows);
        console.log("result", result)
        expect(result).to.equal('1');
        expect(querystub.calledOnce).to.be.true;

        expect(querystub.firstCall.args[1]).to.deep.equal([
          "1","1","speaker",true,"123","SKitche",
          "Speaker in kitchen","32","100","0"
        ]);    })

})