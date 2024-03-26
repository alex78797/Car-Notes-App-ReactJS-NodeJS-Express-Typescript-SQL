import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import validator from "validator";
import {
  getUserByEmailDB,
  saveUserDB,
  addUserRefreshTokensDB,
  getUserByIdDB,
  deleteUserRefreshTokenDB,
  getRefreshTokenInfoDB,
  deleteAllUserRefreshTokensDB,
} from "../services/auth.service";
import { sanitizeUserInput } from "../utils/sanitizeUserInput";
import { IToken, IUser, UserJwtPayload } from "../models/models";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/generateAndHashTokens";
import jwt from "jsonwebtoken";

/**
 * @description Registers a user
 * @route POST /api/auth/register
 * @access public user does not have to be authorized in to access the route.
 */
export async function registerUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // get email and password from the user
    const userInput = sanitizeUserInput(req.body) as {
      email: string;
      password: string;
      confirmPassword: string;
      userName: string;
    };

    const { email, password, confirmPassword, userName } = userInput;

    if (!email) {
      return res.status(400).json({ error: "Email is mandatory!" });
    }

    if (!password) {
      return res.status(400).json({ error: "Password is mandatory!" });
    }

    if (!confirmPassword) {
      return res
        .status(400)
        .json({ error: "Password confirmation is mandatory!" });
    }

    if (!userName) {
      return res.status(400).json({ error: "Username is mandatory!" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match!" });
    }

    // validate email and password
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: "Email is not valid!" });
    }

    // validator packages accepts passwords with at least 8 characters.
    // -> A stronger requirement: password must contain at least 12 characters
    if (password.length < 12) {
      return res
        .status(400)
        .json({ error: "Password must contain at least 12 characters!" });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({
        error:
          "Password must include small letters, capital letters, numbers and special characters!",
      });
    }

    const emailAlreadyExists = await getUserByEmailDB(email);
    if (emailAlreadyExists) {
      return res.status(400).json({ error: "Email alredy exists!" });
    }

    // hash the user password using bcrypt
    const salt: string = await bcrypt.genSalt(12);
    const hashedPassword: string = await bcrypt.hash(password, salt);

    await saveUserDB(userName, email, hashedPassword);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

/**
 * @description Allows a user to log in
 * @route POST /api/auth/login
 * @access public user does not have to be authorized in to access the route.
 */
export async function loginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const cookies = req.cookies;

    // get email and password from the user
    const userInput = sanitizeUserInput(req.body) as {
      email: string;
      password: string;
    };

    const email = userInput.email;
    const userPassword = userInput.password;

    if (!email) {
      return res.status(400).json({ error: "Email required!" });
    }

    if (!userPassword) {
      return res.status(400).json({ error: "Password required!" });
    }

    const user: IUser = await getUserByEmailDB(email);

    if (!user) {
      return res.status(401).json({ error: "Email does not exist!" });
    }

    // evaluate password match
    const passwordsMatch: boolean = await bcrypt.compare(
      userPassword,
      user.password
    );

    if (!passwordsMatch) {
      return res.status(401).json({ error: "Wrong passoword!" });
    }

    // Possible scenario (which is not handled on the client/frontend):
    // user goes to login page and logs in without "manually" logging out before
    // (user logs in, than goes from home page to login page and is not redirected from login page to home page)
    const oldRefreshToken = sanitizeUserInput(cookies.refreshToken) as string;
    if (oldRefreshToken) {
      const tokenInfo = await getRefreshTokenInfoDB(oldRefreshToken);
      if (!tokenInfo) {
        try {
          const decodedUserInfo = jwt.verify(
            oldRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
          ) as UserJwtPayload;
          await deleteAllUserRefreshTokensDB(
            sanitizeUserInput(decodedUserInfo.userId) as string
          );
        } catch (error) {
          // if refresh token is invalid, assume it expired --> try to log hacked user out without verifying the token
          // get the decoded payload without verifying the token, ignoring signature, no secretOrPrivateKey needed
          const decodedUserInfo = jwt.decode(oldRefreshToken) as UserJwtPayload;
          if (decodedUserInfo && decodedUserInfo.userId) {
            const userId = sanitizeUserInput(decodedUserInfo.userId) as string;
            if (userId) {
              if (validator.isUUID(userId)) {
                await deleteAllUserRefreshTokensDB(userId);
              }
            }
          }
        }
      } else {
        await deleteUserRefreshTokenDB(oldRefreshToken);
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "PRODUCTION",
      });
    }

    // generate an access token and refresh token
    const accessToken: string = generateAccessToken(user.userId, user.roles);
    const newRefreshToken: string = generateRefreshToken(user.userId);

    await addUserRefreshTokensDB(newRefreshToken, user.userId);

    // Creates Secure Cookie with refresh token
    res.cookie("refreshToken", newRefreshToken, {
      secure: process.env.NODE_ENV === "PRODUCTION", // if true, cookie is sent only over HTTPS
      httpOnly: true, // cookie not accessible to client-side javascript
      sameSite: "strict", // the web browser prevents cookie data from being transferred during cross-domain requests in all instances
      maxAge: 24 * 60 * 60 * 1000, // one day
    });

    // send all the user properties to the client except the password
    const { password, ...otherUserProperties } = user;

    // Send the user properties and the access token to client.
    return res
      .status(200)
      .json({ user: otherUserProperties, accessToken: accessToken });
  } catch (error) {
    next(error);
  }
}

/**
 * @description Logs a user out (TODO: also clear accessToken on the client)
 * @route POST /api/auth/logout
 * @access public user does not have to be authorized in to access the route.
 */
export async function logoutUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const cookies = req.cookies;
    // console.log(cookies); // Output: {refreshToken: "..."}

    if (!cookies) {
      return res.sendStatus(204);
    }

    // return 204 status if the refresh token cookie is not sent with the request (there is nothing to do)
    if (!cookies.refreshToken) {
      // 204 status: the server has successfully processed the request, but it is not returning any content
      return res.sendStatus(204);
    }

    const refreshToken = sanitizeUserInput(cookies.refreshToken) as string;

    // if refresh token is not in the db but we still have a cookie, delete the cookie
    const tokenInfo: IToken = await getRefreshTokenInfoDB(refreshToken);
    if (!tokenInfo) {
      try {
        const decodedUserInfo = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        ) as UserJwtPayload;
        await deleteAllUserRefreshTokensDB(
          sanitizeUserInput(decodedUserInfo.userId) as string
        );
      } catch (error) {
        // if refresh token is invalid, assume it expired --> try to log hacked user out without verifying the token
        // get the decoded payload without verifying the token, ignoring signature, no secretOrPrivateKey needed
        const decodedUserInfo = jwt.decode(refreshToken) as UserJwtPayload;
        if (decodedUserInfo && decodedUserInfo.userId) {
          const userId = sanitizeUserInput(decodedUserInfo.userId) as string;
          if (userId) {
            if (validator.isUUID(userId)) {
              await deleteAllUserRefreshTokensDB(userId);
            }
          }
        }
      }

      res.clearCookie("refreshToken", {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "PRODUCTION",
      });

      // 204 status: the server has successfully processed the request, but it is not returning any content
      return res.sendStatus(204);
    }

    // delete the refresh token
    await deleteUserRefreshTokenDB(refreshToken);

    // Delete the current cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "PRODUCTION",
    });

    // 204 status: the server has successfully processed the request, but it is not returning any content
    return res.sendStatus(204);
  } catch (error) {
    next(error);
  }
}

/**
 * @description create a new access token.
 * @route GET /api/auth/refresh
 * @access public user does not have to be authorized in to access the route.
 */
export async function refreshAccessToken(req: Request, res: Response) {
  const cookies = req.cookies;

  if (!cookies) {
    return res.sendStatus(401);
  }

  // return 401 (unauthorized) status if the refresh token cookie is not sent with the request.
  if (!cookies.refreshToken) {
    return res.sendStatus(401);
  }

  // save the refresh token cookie in memory and delete it, because every refresh token should only be used once. (a new will be cookie sent)
  const refreshToken = sanitizeUserInput(cookies.refreshToken) as string;
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "PRODUCTION",
  });

  // get tokenInfo by the refresh token from the database
  const tokenInfo = await getRefreshTokenInfoDB(refreshToken);

  // no info found. An attacker may try to reuse a refresh token which was used once by another user --> Refresh token reuse!
  if (!tokenInfo) {
    try {
      const decodedUserInfo = jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET
      ) as UserJwtPayload;
      // try to log hacked user out of all devices
      const hackedUser = await getUserByIdDB(
        sanitizeUserInput(decodedUserInfo.userId) as string
      );
      await deleteAllUserRefreshTokensDB(hackedUser.userId);
    } catch (error) {
      // if refresh token is invalid, assume it expired --> try to log hacked user out without verifying the token
      // get the decoded payload without verifying the token, ignoring signature, no secretOrPrivateKey needed
      const decodedUserInfo = jwt.decode(refreshToken) as UserJwtPayload;
      if (decodedUserInfo && decodedUserInfo.userId) {
        const userId = sanitizeUserInput(decodedUserInfo.userId) as string;
        if (userId) {
          if (validator.isUUID(userId)) {
            await deleteAllUserRefreshTokensDB(userId);
          }
        }
      }
    } finally {
      return res.sendStatus(401);
    }
  }

  let user: IUser;
  try {
    // token info is found, token is still valid --> delete token from the database, get user by that id
    await deleteUserRefreshTokenDB(refreshToken);
    user = await getUserByIdDB(tokenInfo.userId);
  } catch (error) {
    return res.sendStatus(401);
  }

  try {
    // evaluate jwt
    const decodedUserInfo = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    ) as UserJwtPayload;

    if (user.userId !== decodedUserInfo.userId) {
      return res.sendStatus(401);
    }

    // Refresh token was still valid
    const newAccessToken = generateAccessToken(user.userId, user.roles);
    const newRefreshToken = generateRefreshToken(user.userId);

    await addUserRefreshTokensDB(newRefreshToken, user.userId);

    // Creates Secure Cookie with refresh token
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "PRODUCTION",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    // send all the user properties to the client except password
    const { password, ...otherUserProperties } = user;

    // send the user properties and the new access token
    return res
      .status(200)
      .json({ user: otherUserProperties, newAccessToken: newAccessToken });
  } catch (error) {
    // Some possible reasons for error: refresh token expired, someone tempered it,
    // someone entered in the headers a token signed with the wrong secret.
    await deleteUserRefreshTokenDB(refreshToken);
    return res.sendStatus(401);
  }
}
