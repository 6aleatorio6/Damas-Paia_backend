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

  async create(index = 0) {
    if (!this.isInitialized) await this.initialize();

    const numberRandom = Math.random() * 100 + index;
    try {
      this.dbName = `TEST_POSTGRES_PAIA_${numberRandom}`;
      await this.query(`CREATE DATABASE "${this.dbName}"`);
      await this.destroy();
    } catch (error) {
      console.count('error');

      this.create(index + 1);
    }
  }

  async deleteAll() {
    await this.initialize();

    const databases: { datname: string }[] = await this.query(
      "SELECT datname FROM pg_database WHERE datname LIKE 'TEST_POSTGRES_PAIA_%'",
    );

    const queries = databases.map((db) => this.query(`DROP DATABASE "${db.datname}"`));

    await Promise.all(queries);

    await this.destroy();
  }
}

export default () => new DbTest().deleteAll();
