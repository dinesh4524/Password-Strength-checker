import { get, run } from './db';

/**
 * User interface representing the user structure in the system.
 */
export interface User {
  id: string;
  email: string;
  password: string;
}

/**
 * Database model for users.
 */
class UserModel {
  /**
   * Find a user by email.
   */
  async findByEmail(email: string): Promise<User | undefined> {
    return get<User>('SELECT * FROM users WHERE email = ?', [email]);
  }

  /**
   * Find a user by ID.
   */
  async findById(id: string): Promise<User | undefined> {
    return get<User>('SELECT * FROM users WHERE id = ?', [id]);
  }

  /**
   * Create a new user.
   */
  async create(userData: User): Promise<User> {
    await run('INSERT INTO users (id, email, password) VALUES (?, ?, ?)', [
      userData.id,
      userData.email,
      userData.password
    ]);
    return userData;
  }
}

export const userModel = new UserModel();
