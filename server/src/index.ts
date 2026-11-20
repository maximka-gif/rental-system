import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import { UPLOAD_DIR } from "./middleware/upload";
import { authenticate, requireRole } from "./middleware/auth";
import { errorHandler } from "./middleware/error";
import propertiesRoutes from "./routes/properties.routes";
import tenantsRoutes from "./routes/tenants.routes";
import invitesRoutes from "./routes/invites.routes";
import leasesRoutes from "./routes/leases.routes";
import invoicesRoutes from "./routes/invoices.routes";
import paymentsRoutes from "./routes/payments.routes";

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL }));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));
// перевірка, що сервер живий
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/tenants", tenantsRoutes);
app.use("/api/leases", leasesRoutes);
app.use("/api/invoices", invoicesRoutes);
app.use("/api/invites", invitesRoutes);
app.use("/api/payments", paymentsRoutes);

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