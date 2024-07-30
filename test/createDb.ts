import { DataSource } from 'typeorm';

export class DbTest extends DataSource {
  public dbName: string;
  constructor() {
    super({
      type: 'postgres',
      username: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      host: process.env['DB_HOST'],
      port: +process.env['DB_PORT'],
      database: 'postgres',
    });

    this.dbName = `TEST_DB_PAIA_${Date.now() + Math.floor(Math.random() * 100)}`;
  }

  async create() {
    await this.initialize();
    await this.query(`CREATE DATABASE "${this.dbName}"`);
    await this.destroy();
  }

  async delete() {
    await this.initialize();
    await this.query(`DROP DATABASE "${this.dbName}"`);
    await this.destroy();
  }
}
