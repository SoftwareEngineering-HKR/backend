import dbs from "../../src/service/DatabaseService.js";

async function runTest() {
	try {
		console.log("Running database test...");

		await dbs.connect();

		const time = await dbs.query("SELECT NOW()");
		console.log("Database responded:", time);

		await dbs.query(`
          CREATE TABLE IF NOT EXISTS test_table (
            id SERIAL PRIMARY KEY,
            name TEXT
          )
        `);

		const inserted = await dbs.query("INSERT INTO test_table(name) VALUES($1) RETURNING *", ["test entry"]);

		console.log("Inserted:", inserted);

		const rows = await dbs.query("SELECT * FROM test_table");
		console.log("All rows:", rows);

		console.log("Database test successful");

		process.exit(0);
	} catch (err) {
		console.error("Database test failed:", err);
		process.exit(1);
	}
}

runTest();
