import { expect } from "chai";
import dbs from "../../src/service/DatabaseService.js";

describe("DatabaseService integration", function () {
    before(async () => {
        await dbs.connect();
    });

    beforeEach(async () => {
        await dbs.query(`
            CREATE TABLE IF NOT EXISTS test_table (
                id SERIAL PRIMARY KEY,
                name TEXT
            )
        `);

        await dbs.query("DELETE FROM test_table");
    });

    after(async () => {
        await dbs.query("DROP TABLE IF EXISTS test_table");
    });

    it("should insert and fetch rows from the database", async () => {
        const inserted = await dbs.query(
            "INSERT INTO test_table(name) VALUES($1) RETURNING *",
            ["test entry"]
        );

        expect(inserted.rows).to.have.lengthOf(1);
        expect(inserted.rows[0].name).to.equal("test entry");

        const result = await dbs.query("SELECT * FROM test_table");

        expect(result.rows).to.have.lengthOf(1);
        expect(result.rows[0].name).to.equal("test entry");
    });
});
