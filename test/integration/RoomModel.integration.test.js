import { expect } from "chai";
import RoomModel from "../../src/model/RoomModel.js";
import dbs from "../../src/service/DatabaseService.js";

describe("RoomModel Integration Test", function () {
    const roomId = "b42410ee-132f-42ee-9e4f-09a6485c95b8";
    const roomName = "Kitchen"

    before(async () => {
        await dbs.connect();
        
    });

    beforeEach(async () => {
        await dbs.query("DELETE FROM rooms WHERE name = $1", [roomName]);
    });


    it("getRoom - Should get the room by id", async () => {
        await dbs.query(
            "INSERT INTO rooms (id, name) VALUES ($1, $2)",
            [roomId, roomName]
        )

        const result = await RoomModel.getRoom(roomId);
        expect(result).to.deep.equal({name: roomName});
    });

    it("setRoom - Should insert a new room with name", async () => {
        await RoomModel.setRoom(roomName);

        const result = await dbs.query(
            "SELECT * FROM rooms WHERE name = $1",
            [roomName]
        );

        expect(result.length).to.equal(1);
        expect(result[0].name).to.equal(roomName);
    });

    it("deleteRoom - Should delete a room ", async () => {
        await dbs.query(
            "INSERT INTO rooms (id, name) VALUES ($1, $2)",
            [roomId, roomName]
        )
        await RoomModel.deleteRoom(roomId);

        const result = await dbs.query(
            "SELECT * FROM rooms WHERE id = $1",
            [roomId]
        );
        expect(result.length).to.equal(0);
    });
});