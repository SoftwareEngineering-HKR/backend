import ScaleModel from '../../src/model/ScaleModel.js';
import DatabaseService from "../../src/service/DatabaseService.js";
import { expect } from "chai";
import sinon from "sinon";

describe("ScaleModel", function() {
    let querystub;
    let scalestub;

    afterEach(() => {
        if(querystub) sinon.restore();
    });

    it("getValue function", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves({
            rows: [{ value: 4, min_value: 10, max_value: 25 }]
        });

        const result = await ScaleModel.getValue("1");
        expect(result).to.deep.equal({
            value: 4,
            min_value: 10,
            max_value: 25
        });
       
    });
    it("getValue - throws if scale does not exist", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: [] });

        try {
            await ScaleModel.getValue("1");
            throw new Error("Should have thrown");
        } catch (err) {
            expect(err.message).to.equal("No scale for this device found.");
        }
   });
    it("updateValue function", async () => {
        querystub = sinon.stub(DatabaseService, "query").resolves({ rowCount: 1,
        rows: [{ id_device: "1" }] });
        scalestub = sinon.stub(ScaleModel, "getValue").resolves({value: 4, min_value: 0, max_value: 25});
        const result = await ScaleModel.updateValue("1", 5);

        expect(result).to.deep.equal( "1" );
    });
    it("updateValue - throws if value exeeds max", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: [] });
        scalestub = sinon.stub(ScaleModel, "getValue").resolves({value: 30, min_value: 0, max_value: 25});


        try {
            await ScaleModel.updateValue("1", 30);
            throw new Error("Should have thrown");
        } catch (err) {
            expect(err.message).to.equal("Value can not exceed max value");
        }
   });
       it("deleteValue - function", async () => {
        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rowCount: 0});
        const result = await ScaleModel.deleteValue("1");
        expect(result).to.deep.equal(false);
   });
});