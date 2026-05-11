import { expect } from "chai";
import RefreshModel  from "../../src/model/RefreshModel.js"
import dbs from "../../src/service/DatabaseService.js";


describe('RefreshModel integration', ()=>{
     before(async () => {
            await dbs.connect();
        });
        
    afterEach(async () => {
            await dbs.query("DELETE FROM refresh_tokens WHERE token = 'fake-token'");
    });

    it('should insert and fetch token from database', async () => {
        const token = await RefreshModel.addToken("fake-token", "00000000-0000-0000-0000-000000000002", "2200-12-12", "ip");
        expect(token).to.equal(true);
        const token_two = await RefreshModel.getToken("fake-token");
        expect(token_two).to.equal(true);
    })

    it('revoke token', async ()=>{
        await RefreshModel.addToken(
        "fake-token",
        "00000000-0000-0000-0000-000000000002",
        "2200-12-12",
        "ip"
        );

        const revoked = await RefreshModel.revokeToken("fake-token");

        expect(revoked).to.equal(true);

        const token = await RefreshModel.getToken("fake-token");

        expect(token).to.equal(false);
        })
})