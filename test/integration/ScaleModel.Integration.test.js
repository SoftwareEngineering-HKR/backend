import { expect } from "chai";
import ScaleModel from "../../src/model/ScaleModel.js";
import dbs from "../../src/service/DatabaseService.js";

describe("ScaleModel Integration Test", function () {
    const scale_id = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
    const id_device = "1234";



    before(async () => {
        await dbs.connect();
        await dbs.query(
            "INSERT INTO devices (id, ip) VALUES ($1, $2)",
            [id_device, "123.123.124.1"]);
        });

    beforeEach(async () => {

        await dbs.query("DELETE FROM scales WHERE id_device = $1", [id_device]);

        await dbs.query(
            "INSERT INTO scales (id, id_device, value, max_value, min_value, name) VALUES ($1, $2, $3, $4, $5, $6)",
            [scale_id, id_device, "1", 1, 0, "Light"]
        );

    });
    after(async () => {
        await dbs.connect();
        await dbs.query(
            "DELETE FROM devices WHERE id = $1", [id_device]);
        });


    it("getValue - Gets a value for that scale", async () => {
        const resExpect = { value: "1", min_value: "0", max_value: "1"};

        const result = await ScaleModel.getValue(id_device);

        expect(result).to.deep.equal(resExpect);
    });


    it("setValue - Sets a value for that scale", async () => {
        const result = await ScaleModel.setValue(id_device, 1, 0, 1);

        expect(result).to.have.property("id"); 

        const rows = await dbs.query(
            "SELECT * FROM scales WHERE id_device = $1",
            [id_device]
        );
        expect(rows.length).to.equal(2);
        expect(rows[0].value).to.equal("1");
        expect(rows[0].min_value).to.equal("0");
        expect(rows[0].max_value).to.equal("1");
    });
    it("updateValue - Update a value for a scale", async () => {
        const result = await ScaleModel.updateValue(id_device, "0");

        const rows = await dbs.query(
            "SELECT * FROM scales WHERE id_device = $1",
            [id_device]
        );
        expect(rows.length).to.equal(1);
        expect(rows[0].value).to.equal("0");
        expect(rows[0].min_value).to.equal("0");
        expect(rows[0].max_value).to.equal("1");
    }); 
    it("deleteValue - Delete a scale", async () => {
        const result = await ScaleModel.deleteValue(scale_id);

        const rows = await dbs.query(
            "SELECT * FROM scales"
        );
        expect(rows.length).to.equal(0);
    });
});