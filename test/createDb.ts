import { DataSource } from 'typeorm';

export class DbTest extends DataSource {
  public dbName: string;
  constructor() {
    super({
      type: 'postgres',
      username: process.env['POSTGRES_USER'],
      password: process.env['POSTGRES_PASSWORD'],
      host: process.env['POSTGRES_HOST'],
      port: +process.env['POSTGRES_PORT'],
      database: 'postgres',
    });

    this.dbName = `TEST_POSTGRES_PAIA_${Date.now() + Math.floor(Math.random() * 100)}`;
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
