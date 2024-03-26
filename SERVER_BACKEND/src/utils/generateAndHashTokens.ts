import { createHash, createHmac } from "crypto";
import jwt from "jsonwebtoken";

/**
 *
 * @param token
 * @returns A hashed JSON Web Token (JWT).
 */
export function hashToken(token: string) {
  const secret = process.env.HASH_BASED_MESSAGE_AUTHENTIFICATION_CODE_SECRET;
  const hash = createHmac("sha256", secret).update(token).digest("base64");
  return hash;
}

/**
 *
 * @param userId the id of the user which logs in
 * @param roles the roles of the user which logs in
 * @returns a JSON Web Token (access token) that signs a JSON object (the payload).
 * The object contains the id and the roles of the user making the request.
 * The access token is has a short live span and expires in 5 minutes.
 *
 * IMPORTANT: make sure the UserJwtPayload interface must have the same properties as the payload object signed here!
 *
 */
export function generateAccessToken(userId: string, roles: string[]): string {
  return jwt.sign(
    {
      userId: userId,
      userRoles: roles,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      // expiresIn: "300s",
      expiresIn: "10s",
    }
  );
}

/**
 *
 * @param userId the id of the user which logs in
 * @returns a JSON Web Token (refresh token) that signs a JSON object (the payload).
 * The object contains the id of the user making the request.
 * The refresh token has a longer life span and expires in 1 day.
 *
 * IMPORTANT: make sure the UserJwtPayload interface must have the same properties as the payload object signed here!
 *
 */
export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    {
      userId: userId,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      // expiresIn: "1d",
      expiresIn: "60s",
    }
  );
}
