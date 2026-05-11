import { expect } from "chai";
import RefreshModel  from "../../src/model/RefreshModel.js"


describe('RefreshModel integration', ()=>{
     before(async () => {
            await dbs.connect();
        });

    beforeEach(async () => {
            await dbs.query(`
                CREATE TABLE IF NOT EXISTS test_table (
                    token VARCHAR(512) NOT NULL UNIQUE,
                    user_id UUID NOT NULL,
                    expires DATE NOT NULL,
                    revoked BOOLEAN DEFAULT false,
                    ip VARCHAR(45) NOT NULL);
                `);
        
            await dbs.query("DELETE FROM test_table");
        });
        
    after(async () => {
            await dbs.query("DROP TABLE IF EXISTS test_table");
    });

    it('should insert and fetch token from database', async () => {
        let token = await RefreshModel.addToken("fake-token", "00000000-0000-0000-0000-000000000002", "2021-02-03", "ip");
        expect(token).to.equal(true);
        token = await RefreshModel.getToken("fake-token");
        expect(token).to.equal(true);
    })

    it('revoke token', async ()=>{
        await RefreshModel.addToken(
        "fake-token",
        "00000000-0000-0000-0000-000000000002",
        "2021-02-03",
        "ip"
        );

        const revoked = await RefreshModel.revokeToken("fake-token");

        expect(revoked).to.equal(true);

        const token = await RefreshModel.getToken("fake-token");

        expect(token).to.equal(true);
        })
})