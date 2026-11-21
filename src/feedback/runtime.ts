import "server-only";
import { createPool } from "mysql2/promise";
import { mysqlDatabase } from "./database";
import { feedbackStaging } from "./staging";

let runtime: ReturnType<typeof createFeedbackRuntime> | undefined;

function createFeedbackRuntime(config: NonNullable<ReturnType<typeof feedbackStaging>>) {
  const pool = createPool({
    host: "127.0.0.1", user: "u926782974_crefb_app", database: "u926782974_crefb_stage",
    password: config.password, charset: "utf8mb4", timezone: "Z", dateStrings: true,
    connectionLimit: 4, queueLimit: 16, connectTimeout: 5000, multipleStatements: false,
  });
  return { config, db: mysqlDatabase(pool), close: () => pool.end() };
}

export function feedbackRuntime() {
  const config = feedbackStaging(process.env);
  return config ? runtime ??= createFeedbackRuntime(config) : null;
}
