import { expect } from "chai";
import sinon from "sinon";
import RefreshModel from "../../src/model/RefreshModel.js"
import DatabaseService from "../../src/service/DatabaseService.js";

describe('RefreshModel', ()=>{
    let querystub;
    afterEach(() => {
        if(querystub) sinon.restore();
    })
    it('gets refresh token', async ()=>{
        const rows = [ "1", "2"]

        querystub = sinon.stub(DatabaseService, "query").resolves(rows);

        const result = await RefreshModel.getToken();

        expect(result).to.equal(true);
        expect(querystub.calledOnce).to.be.true;
    })
    it('add new Token', async ()=>{
        const rows = [ "1", "2"]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves(rows );

        const result = await RefreshModel.addToken();

        expect(result).to.equal(true);
        expect(querystub.calledOnce).to.be.true;
    })
    it('revoke old token', async ()=>{
        const rows = [ "1", "2"]

        querystub = sinon.stub(DatabaseService, "query")
        .resolves(rows);

        const result = await RefreshModel.revokeToken();

        expect(result).to.equal(true);
        expect(querystub.calledOnce).to.be.true;
    })
})