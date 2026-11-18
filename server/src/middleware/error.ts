import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "../utils/errors";


export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Помилка валідації",
      errors: err.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }

    if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "Файл завеликий (максимум 5 МБ)" : "Помилка завантаження файлу";
    return res.status(400).json({ message });
  }
  
  console.error(err);
  res.status(500).json({ message: "Внутрішня помилка сервера" });
}