import sqlite3 from 'sqlite3';
import path from 'path';

// Store the SQLite database file in the backend root directory
const dbPath = path.resolve(__dirname, '../../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

/**
 * Execute a SQL query (INSERT, UPDATE, DELETE).
 */
export const run = (sql: string, params: any[] = []): Promise<{ lastID?: number; changes?: number }> => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
};

/**
 * Fetch a single row.
 */
export const get = <T>(sql: string, params: any[] = []): Promise<T | undefined> => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row as T | undefined);
      }
    });
  });
};

/**
 * Fetch all matching rows.
 */
export const all = <T>(sql: string, params: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows as T[]);
      }
    });
  });
};

/**
 * Initialize database tables if they do not exist.
 */
export const initDb = async () => {
  try {
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS password_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    console.log('SQLite database tables initialized.');
  } catch (error) {
    console.error('Error initializing database tables:', error);
    throw error;
  }
};

export default db;
