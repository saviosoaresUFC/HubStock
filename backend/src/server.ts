import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import routes from "./routes/index.js";
import { AppDataSource } from "./config/data-source.js";
import { runSeeder } from "./seeds/mainSeed.js";
import { errorMiddleware } from "./middlewares/errorMiddleware.js";
import morgan from "morgan";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use(routes);
app.use(errorMiddleware);

const PORT = 3000;

try {
    await AppDataSource.initialize();
    console.log("SQLite conectado!");

    await runSeeder();

    app.listen(PORT, () => {
        console.log(`HubStock BackEnd rodando em http://localhost:${PORT}`);
    });
} catch (error) {
    console.log(error);
}