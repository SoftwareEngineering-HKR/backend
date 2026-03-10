import { Pool } from "pg";

class DatabaseService {
	constructor() {
		this.db = new Pool({
			host: process.env.DB_HOST,
			user: process.env.DB_USER,
			password: process.env.DB_PASS,
			database: process.env.DB_DATABASE,
			port: 5432,
		});
	}

	async connect() {
		this.db.on("connect", () => {
			console.log("Connected to PostgreSQL");
		});
	}

	async query(sql, args = []) {
		const { rows } = await this.db.query(sql, args);
		return rows;
	}
}

export default new DatabaseService();
