import { DurableObject } from 'cloudflare:workers';

export class ThingsObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ensureTable();
	}

	async ensureTable() {
		// Create the table if it doesn't exist
		this.ctx.storage.sql.exec(
			`CREATE TABLE IF NOT EXISTS things (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				content TEXT NOT NULL
			)`
		);
	}

	async createThing(content: string): Promise<{ id: number; content: string }> {
		const cursor = this.ctx.storage.sql.exec<{ id: number }>('INSERT INTO things (content) VALUES (?) RETURNING id', content);
		const row = cursor.one();
		return { id: row.id, content };
	}

	async getThing(id: number): Promise<{ id: number; content: string } | null> {
		const cursor = this.ctx.storage.sql.exec<{ id: number; content: string }>('SELECT id, content FROM things WHERE id = ?', id);
		const row = cursor.one();
		return row ?? null;
	}

	async updateThing(id: number, content: string): Promise<boolean> {
		const cursor = this.ctx.storage.sql.exec('UPDATE things SET content = ? WHERE id = ?', content, id);
		return cursor.rowsWritten > 0;
	}

	async deleteThing(id: number): Promise<boolean> {
		const cursor = this.ctx.storage.sql.exec('DELETE FROM things WHERE id = ?', id);
		return cursor.rowsWritten > 0;
	}

	async listThings(): Promise<Array<{ id: number; content: string }>> {
		const cursor = this.ctx.storage.sql.exec<{ id: number; content: string }>('SELECT id, content FROM things ORDER BY id ASC');
		return cursor.toArray();
	}
}
