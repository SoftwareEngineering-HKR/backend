import express from "express";
import db from "../src/service/DatabaseService.js";

const app = express();

app.get("/", (req, res) => {
	res.send("Hello World!");
});

async function dbTest() {
	const result = await db.query("SELECT NOW()");
	console.log("WORKS =>", result);
}

dbTest();

(app.listen(3000),
	() => {
		console.log("Server running on port 3000...");
	});
