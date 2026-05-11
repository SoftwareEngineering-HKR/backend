import { expect } from "chai";
import UserDeviceModel from "../../src/model/UserDevicesModel.js";
import dbs from "../../src/service/DatabaseService.js";

describe("UserDeviceModel Integration Test", function () {

    const userId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
    beforeEach(async () => {
        await dbs.query("DELETE FROM user_devices");
        await dbs.query("DELETE FROM devices");
        await dbs.query("DELETE FROM users");
    });

    it("getDevicesByUser - returns connected devices", async () => {
        await dbs.query(
            "INSERT INTO users (id, username, password) VALUES ($1, $2, $3)",
            [userId, "test", "pass"]
        );

        await dbs.query(
            "INSERT INTO devices (id, ip) VALUES ($1, $2)",
            ["device1", "192.168.1.1"]
        );

        await dbs.query(
            "INSERT INTO user_devices (id_user, id_device) VALUES ($1, $2)",
            [userId, "device1"]
        );

        const result = await UserDeviceModel.getDevicesByUser(userId);

        expect(result).to.deep.equal(["device1"]);
    });
    it("addUserToDevice - adds user-device relation", async () => {
        await dbs.query(
            "INSERT INTO users (id, username, password) VALUES ($1, $2, $3)",
            [userId, "test", "pass"]
        );

        await dbs.query(
            "INSERT INTO devices (id, ip) VALUES ($1, $2)",
            ["device1", "192.168.1.1"]
        );

        const result = await UserDeviceModel.addUserToDevice(
            userId,
            "device1"
        );

        expect(result).to.equal(true);

        const rows = await dbs.query(
            `SELECT * FROM user_devices
            WHERE id_user = $1 AND id_device = $2`,
            [userId, "device1"]
        );

        expect(rows.length).to.equal(1);
    });
});