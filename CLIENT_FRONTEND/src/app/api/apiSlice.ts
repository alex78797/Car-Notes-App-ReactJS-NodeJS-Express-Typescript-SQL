import {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
  createApi,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import {
  removeCredentials,
  setCredentials,
} from "../../features/auth/authSlice";
import { Mutex } from "async-mutex";
import { IUser } from "../../types/types";

// create a new mutex 
const mutex = new Mutex();

// base query which defines the base url, includes cookies and the requests and sets the authorization header
const baseQuery = fetchBaseQuery({
  baseUrl: "http://localhost:3000/api",
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const accessToken = (getState() as RootState).auth.accessToken;
    if (accessToken) {
      headers.set("authorization", "Bearer" + " " + accessToken);
    }
    return headers;
  },
});

// base query which automatically reauthenticates the user if its access token expires (similarly to axios interceptors)
const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // wait until the mutex is available without locking it <---> wait with this request if a reauth is going on
  await mutex.waitForUnlock();
  // mutex is unlocked, a reauth took place, user is probably authenticated again
  // ---> run request with the new access token (the new access token is valid --> result should not return 403 error)
  let result = await baseQuery(args, api, extraOptions);

  // When using this BACKEND_SERVER, 403 status code means access token is not valid
  // Assume access token expired --> refresh it
  if (
    result.error &&
    "originalStatus" in result.error &&
    result.error.originalStatus === 403
  ) {
    // Check whether the mutex is locked.
    // (Requests which check this condition did not waitForUnlock() in the request interceptor)
    if (!mutex.isLocked()) {
      // Calling acquire will return a promise that resolves once the mutex becomes available.
      // The value of the resolved promise is a function that can be called to release the mutex once the task has completed.
      const release = await mutex.acquire();
      try {
        // get a new access token if the old one expired and the refresh token is still valid
        const refreshResult = await baseQuery(
          "/auth/refresh",
          api,
          extraOptions
        );

        // @ts-ignore
        const newAccessToken: string = refreshResult.data?.newAccessToken;
        // @ts-ignore
        const user: IUser = refreshResult.data?.user;

        // store the new access token in global state
        if (newAccessToken && user) {
          api.dispatch(
            setCredentials({ user: user, accessToken: newAccessToken })
          );
          // retry the initial query
          result = await baseQuery(args, api, extraOptions);
        } else {
          // logout (delete cookie from browser), remove credentials, delete all previous state
          await fetch("http://localhost:3000/api/auth/logout", {
            method: "POST",
            credentials: "include",
          });
          api.dispatch(removeCredentials());
          api.dispatch(apiSlice.util.resetApiState());
        }
      } finally {
        // release must be called once the mutex should be released again
        release();
      }
    } else {
      // wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      // mutex is unlocked, a reauth took place, user is probably authenticated again ---> retry original query
      result = await baseQuery(args, api, extraOptions);
    }
  }
  return result;
};

export const apiSlice = createApi({
  baseQuery: baseQueryWithReauth,
  tagTypes: ["cars"],
  // underscore `_` is added to please typescript (variable not used (?))
  endpoints: (_builder) => ({}),
});
