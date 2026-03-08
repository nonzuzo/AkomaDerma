import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
  port: parseInt(process.env.MYSQLPORT || process.env.DB_PORT || "3306"),
  user: process.env.MYSQLUSER || process.env.DB_USER || "root",
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || "1234",
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || "telederma_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log(" Connected to MySQL database successfully!");
    connection.release();
    return pool;
  } catch (error) {
    console.error(" Error connecting to MySQL:", error);
    process.exit(1);
  }
}

export default pool;
