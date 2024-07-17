import { User } from 'src/user/entities/user.entity';
import { DataSource } from 'typeorm';

export class DbTest {
  private db: DataSource;
  public dbName: string;
  constructor() {
    this.dbName = `TEST_DB_PAIA_${Date.now() + Math.floor(Math.random() * 100)}`;

    this.db = new DataSource({
      type: 'postgres',
      username: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      host: process.env['DB_HOST'],
      port: +process.env['DB_PORT'],
      entities: [User],
      database: 'postgres',
    });
  }

  async create() {
    await this.db.initialize();
    await this.db.query(`CREATE DATABASE "${this.dbName}"`);
    await this.db.destroy();
    return this.dbName;
  }

  async delete() {
    await this.db.initialize();
    await this.db.query(`DROP DATABASE "${this.dbName}"`);
    await this.db.destroy();
  }
}
