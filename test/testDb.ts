import { DataSource } from 'typeorm';

export class DbTest extends DataSource {
  public dbName: string;
  constructor() {
    super({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      database: 'postgres',
    });
  }

  async create() {
    await this.initialize();
    const createDb = async () => {
      try {
        this.dbName = `TEST_POSTGRES_PAIA_${Date.now() + Math.floor(Math.random() * 100)}`;
        await this.query(`CREATE DATABASE "${this.dbName}"`);
      } catch {
        createDb();
      }
    };
    await createDb();
    await this.destroy();
  }

  async deleteAll() {
    await this.initialize();

    const databases: { datname: string }[] = await this.query(
      "SELECT datname FROM pg_database WHERE datname LIKE 'TEST_POSTGRES_PAIA_%'",
    );

    const querys = databases.map((db) =>
      this.query(`DROP DATABASE "${db.datname}"`),
    );

    await Promise.all(querys);

    await this.destroy();
  }
}

//
//

export default () => new DbTest().deleteAll();
