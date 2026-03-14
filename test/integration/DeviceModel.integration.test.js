import { expect } from "chai";
import DeviceModel from "../../src/model/DeviceModel.js";
import dbs from "../../src/service/DatabaseService.js";

describe("DeviceModel Integration Test", function () {
    const id = "1111-111111111";
    const roomId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";

    before(async () => {
        await dbs.connect();
    });

    beforeEach(async () => {
        // Delete child tables before parent tables
        await dbs.query("DELETE FROM scales WHERE id_device = $1", [id]);
        await dbs.query("DELETE FROM devices WHERE id = $1", [id]);
        await dbs.query("DELETE FROM rooms WHERE id = $1", [roomId]);
    });

    it("Should set the device and scale", async () => {

        await dbs.query(
            "INSERT INTO rooms (id, name) VALUES ($1, $2)",
            [roomId, "Kitchen"]
        );

        const result = await DeviceModel.setDevice(
            id,
            roomId,
            "light",
            true,
            "192.0.34.1",
            "light",
            "Loud speaker!",
            "49",
            "100",
            "-3"
        );

        expect(result).to.equal(id);

        const deviceRows = await dbs.query(
            "SELECT * FROM devices WHERE id = $1",
            [id]
        );

        expect(deviceRows.length).to.equal(1);
        expect(deviceRows[0].name).to.equal("light");
        expect(deviceRows[0].description).to.equal("Loud speaker!");

        const scaleRows = await dbs.query(
            "SELECT * FROM scales WHERE id_device = $1",
            [id]
        );

        expect(scaleRows.length).to.equal(1);
        expect(scaleRows[0].value).to.equal("49");
        expect(scaleRows[0].max_value).to.equal("100");
        expect(scaleRows[0].min_value).to.equal("-3");
    });
});