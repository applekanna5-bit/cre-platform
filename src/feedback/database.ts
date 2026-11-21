import "server-only";
import type { Pool, PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

type Parameter = string | number | null;

export interface Sql {
  rows<T>(statement: string, parameters?: Parameter[]): Promise<T[]>;
  write(statement: string, parameters?: Parameter[]): Promise<number>;
}
export interface Database extends Sql {
  transaction<T>(work: (sql: Sql) => Promise<T>): Promise<T>;
}

function session(connection: Pool | PoolConnection): Sql {
  return {
    async rows<T>(statement: string, parameters: Parameter[] = []) {
      const [rows] = await connection.execute<RowDataPacket[]>(statement, parameters);
      return rows as T[];
    },
    async write(statement, parameters = []) {
      const [result] = await connection.execute<ResultSetHeader>(statement, parameters);
      return result.affectedRows;
    },
  };
}

export function mysqlDatabase(pool: Pool): Database {
  return {
    ...session(pool),
    async transaction(work) {
      const connection = await pool.getConnection();
      let reusable = true;
      try {
        await connection.beginTransaction();
        const result = await work(session(connection));
        await connection.commit();
        return result;
      } catch (error) {
        try {
          await connection.rollback();
        } catch {
          reusable = false;
          connection.destroy();
        }
        throw error;
      } finally {
        if (reusable) connection.release();
      }
    },
  };
}
