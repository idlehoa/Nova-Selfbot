import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

// Lấy đường dẫn thực tế tới thư mục special/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadSpecialAlgorithms() {
  const dir = __dirname;
  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith(".js") && f !== "index.js");

  // Dùng pathToFileURL để chuyển sang file://
  const allModules = await Promise.all(
    files.map(async (file) => {
      const fileUrl = pathToFileURL(path.join(dir, file)).href;
      const module = await import(fileUrl);
      return Object.values(module).filter(fn => typeof fn === "function");
    })
  );
  return allModules.flat();
}