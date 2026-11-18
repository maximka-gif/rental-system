import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import { authenticate, requireRole } from "./middleware/auth";
import { errorHandler } from "./middleware/error";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());

// перевірка, що сервер живий
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);

// тимчасовий маршрут для перевірки ролей (потім видалимо)
app.get("/api/owner-only", authenticate, requireRole("OWNER"), (_req, res) => {
  res.json({ message: "Привіт, власнику" });
});

// обробник помилок завжди підключається останнім
app.use(errorHandler);

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Server: http://localhost:${port}`);
});