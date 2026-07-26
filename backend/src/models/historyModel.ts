import { run, get } from './db';

export interface PasswordHistoryEntry {
  id: string;
  user_id: string;
  password_hash: string;
  created_at?: string;
}

class HistoryModel {
  /**
   * Add a password hash to a user's password history.
   */
  async addHistory(userId: string, passwordHash: string): Promise<PasswordHistoryEntry> {
    const entry: PasswordHistoryEntry = {
      id: Math.random().toString(36).substring(2, 9),
      user_id: userId,
      password_hash: passwordHash,
    };

    await run(
      'INSERT INTO password_history (id, user_id, password_hash) VALUES (?, ?, ?)',
      [entry.id, entry.user_id, entry.password_hash]
    );

    return entry;
  }

  /**
   * Check if a password hash has been previously used by the user.
   */
  async checkHistory(userId: string, passwordHash: string): Promise<boolean> {
    const row = await get<{ count: number }>(
      'SELECT COUNT(*) as count FROM password_history WHERE user_id = ? AND password_hash = ?',
      [userId, passwordHash]
    );
    return (row?.count ?? 0) > 0;
  }
}

export const historyModel = new HistoryModel();
