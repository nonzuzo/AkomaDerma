import dotenv from 'dotenv';
dotenv.config();

// Import mysql2/promise for async/await support
import mysql from "mysql2/promise";


// Create a connection pool (better than single connection)
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "1234",
  database: "telederma_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
export async function connectDB() {
  try {
    const connection = await pool.getConnection();
    console.log("Connected to MySQL database successfully!");
    connection.release(); // Release the connection back to the pool
    return pool;
  } catch (error) {
    console.error(" Error connecting to MySQL:", error);
    process.exit(1);
  }
}

// Export the pool for use in controllers
export default pool;
