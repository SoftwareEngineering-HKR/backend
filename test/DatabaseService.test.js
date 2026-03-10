import DatabaseService from "../src/service/DatabaseService.js";
import { except } from "chai";
import sinon from "sinon";

describe("DatabaseService", function(){
    describe("Return rows", async () => {
        const rows = [{id: 0, name: test}];
        const queryStub = sinon.stub(DatabaseService.db, "query")
            .resolves({rows: rows});
        
        const result = await DatabaseService.query("SELECT * FROM users");

        except(result).to.deep.equel(rows);
        expect(queryStub.calledOnce).to.be.true;

        queryStub.restore();

    })

});

