import { SerializedError } from "@reduxjs/toolkit";
import { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

/**
 * Displays an error message from the server.
 * Component is used when data is added/retrieved from/to the server using the browsers' fetch api.
 * @param param0
 * @returns
 */
function FetchBaseError({
  error,
}: {
  error: FetchBaseQueryError | SerializedError | undefined;
}) {
  return (
    <p style={{ color: "red" }}>
      {/* @ts-ignore */}
      {error.data.error}
    </p>
  );
}

export default FetchBaseError;
