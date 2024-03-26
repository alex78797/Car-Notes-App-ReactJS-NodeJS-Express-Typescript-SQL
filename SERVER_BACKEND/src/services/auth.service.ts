import { pool } from "../config/postgreSQL.config";
import { IToken, IUser } from "../models/models";
import { hashToken } from "../utils/generateAndHashTokens";

/**
 * SQL code that retreives the user with the given email from the database
 * @param email
 * @returns
 */
export async function getUserByEmailDB(email: string): Promise<IUser> {
  const sqlQuery = 'SELECT * FROM "users" WHERE "email" = $1';
  const user = await pool.query(sqlQuery, [email]);
  return user.rows[0];
}

/**
 * SQL code that adds a hashed refresh token to the database
 * @param refreshToken
 * @param userId
 */
export async function addUserRefreshTokensDB(
  refreshToken: string,
  userId: string
): Promise<void> {
  const hashedRefreshToken = hashToken(refreshToken);
  const sqlQuery =
    'INSERT INTO "tokens" ("refreshToken", "userId") VALUES ($1, $2)';
  await pool.query(sqlQuery, [hashedRefreshToken, userId]);
}

/**
 * SQL code that deletes a particular refresh token from the database
 * @param refreshToken
 */
export async function deleteUserRefreshTokenDB(
  refreshToken: string
): Promise<void> {
  const hashedRefreshToken = hashToken(refreshToken);
  const sqlQuery = 'DELETE FROM "tokens" WHERE "refreshToken" = $1';
  await pool.query(sqlQuery, [hashedRefreshToken]);
}

/**
 * SQL code that deletes all the refresh tokens of a particular user
 * @param userId
 */
export async function deleteAllUserRefreshTokensDB(
  userId: string
): Promise<void> {
  const sqlQuery = 'DELETE FROM "tokens" WHERE "userId" = $1';
  await pool.query(sqlQuery, [userId]);
}

/**
 * SQL code that inserts a new user in the database
 * @param userName
 * @param email
 * @param passoword
 */
export async function saveUserDB(
  userName: string,
  email: string,
  passoword: string
): Promise<void> {
  const sqlQuery =
    'INSERT INTO "users" ("userName", "email", "password") VALUES ($1, $2, $3)';
  await pool.query(sqlQuery, [userName, email, passoword]);
}

/**
 * SQL code that retreives the token info stored with a particular refresh token from the database
 * @param refreshToken
 * @returns
 */
export async function getRefreshTokenInfoDB(
  refreshToken: string
): Promise<IToken> {
  const hashedRefreshToken = hashToken(refreshToken);
  const sqlQuery = 'SELECT * FROM "tokens" WHERE "refreshToken" = $1';
  const tokenInfo = await pool.query(sqlQuery, [hashedRefreshToken]);
  return tokenInfo.rows[0];
}

/**
 * SQL code that retreives the user with the given id from the database
 * @param userId
 * @returns
 */
export async function getUserByIdDB(userId: string): Promise<IUser> {
  const sqlQuery = 'SELECT * FROM "users" WHERE "userId" = $1';
  const user = await pool.query(sqlQuery, [userId]);
  return user.rows[0];
}
