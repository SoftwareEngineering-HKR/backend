import { expect } from "chai";
import sinon from "sinon";
import router from "../../src/model/RefreshModel.js"

describe('RefreshModel', ()=>{
    let querystub;
    afterEach(() => {
        if(querystub) sinon.restore();
    })
    it('gets refresh token', async ()=>{
        const rows = [{ id: "1", id: "2" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = await DeviceModel.getDevices();

        expect(result).to.deep.equal(rows);
        expect(querystub.calledOnce).to.be.true;
    })
    it('add new Token', async ()=>{
        const rows = [{ id: "1", id: "2" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = await DeviceModel.getDevices();

        expect(result).to.deep.equal(rows);
        expect(querystub.calledOnce).to.be.true;
    })
    it('revoke old token', async ()=>{
        const rows = [{ id: "1", id: "2" }]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves({ rows: rows });

        const result = await DeviceModel.getDevices();

        expect(result).to.deep.equal(rows);
        expect(querystub.calledOnce).to.be.true;
    })
})