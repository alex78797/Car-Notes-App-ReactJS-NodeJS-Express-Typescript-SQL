import express from "express";
import "dotenv/config";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import { carRouter } from "./routes/cars.routes";
import { authRouter } from "./routes/auth.routes";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { userRouter } from "./routes/user.routes";

// initialize the app/server
const app = express();

// save the port number from the .env file
const port = process.env.PORT;

// some extra security
app.use(helmet());

// configure cors with the allowed origin and also allow sending cookies
// first origin is for vite in dev mode, second origin is for vite in production preview mode
// client app is here a React app built with a tool called `vite`, and not with `create-react-app`
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:4173"],
    credentials: true,
  })
);

// needed to send/receive data in json format to/from the client
app.use(express.json());

// needed to send/receive cookies to/from the client
app.use(cookieParser());

// use the created routes
app.use("/api/cars", carRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);

// use the error handler middleware
app.use(errorHandler);

// run the server on the given port
app.listen(port, () => {
  return console.log(`Express is listening at http://localhost:${port}`);
});
