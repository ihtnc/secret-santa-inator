import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
}

// This test suite validates the database schema
// Note: Requires a test database connection
describe('Database Schema Tests', () => {
  let client: Client;
  const useRealDb = process.env.TEST_DATABASE_URL !== undefined;

  beforeAll(async () => {
    if (!useRealDb) {
      console.log('Skipping DB tests - TEST_DATABASE_URL not set');
      return;
    }

    client = new Client({
      connectionString: process.env.TEST_DATABASE_URL,
    });
    await client.connect();
  });

  afterAll(async () => {
    if (useRealDb && client) {
      await client.end();
    }
  });

  it('should have valid SQL schema files', () => {
    const schemaFile = path.join(__dirname, '../001_initial_secret_santa_schema.sql');
    expect(fs.existsSync(schemaFile)).toBe(true);

    const content = fs.readFileSync(schemaFile, 'utf-8');
    expect(content).toContain('CREATE TABLE');
  });

  it('should have vault encryption setup file', () => {
    const vaultFile = path.join(__dirname, '../002_setup_vault_encryption_key.sql');
    expect(fs.existsSync(vaultFile)).toBe(true);
  });

  it.skipIf(!useRealDb)('should have groups table with correct structure', async () => {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'groups'
      ORDER BY ordinal_position;
    `);

    const columns = result.rows as ColumnInfo[];
    expect(columns.length).toBeGreaterThan(0);

    const columnNames = columns.map(c => c.column_name);
    expect(columnNames).toContain('guid');
    expect(columnNames).toContain('name');
    expect(columnNames).toContain('capacity');
  });

  it.skipIf(!useRealDb)('should have members table with correct structure', async () => {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'members'
      ORDER BY ordinal_position;
    `);

    const columns = result.rows as ColumnInfo[];
    expect(columns.length).toBeGreaterThan(0);

    const columnNames = columns.map(c => c.column_name);
    expect(columnNames).toContain('guid');
    expect(columnNames).toContain('group_guid');
    expect(columnNames).toContain('name');
  });

  it.skipIf(!useRealDb)('should have assignments table with correct structure', async () => {
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'assignments'
      ORDER BY ordinal_position;
    `);

    const columns = result.rows as ColumnInfo[];
    expect(columns.length).toBeGreaterThan(0);

    const columnNames = columns.map(c => c.column_name);
    expect(columnNames).toContain('guid');
    expect(columnNames).toContain('group_guid');
  });

  it.skipIf(!useRealDb)('should have proper foreign key constraints', async () => {
    const result = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name IN ('members', 'assignments', 'messages');
    `);

    expect(result.rows.length).toBeGreaterThan(0);
  });
});
