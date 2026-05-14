import { Pool } from 'pg';
import { getSecret } from './secrets';

let pool: Pool | null = null;

export async function getDbPool(): Promise<Pool> {
  if (pool) {
    return pool;
  }

  // Fetch the secure database password from Secret Manager
  const dbPassword = await getSecret('db_password');
  
  // Connect to the Cloud SQL instance over the private VPC network
  // In a real environment, DB_HOST should be the internal IP of the Cloud SQL instance
  pool = new Pool({
    user: process.env.DB_USER || 'evms_admin',
    host: process.env.DB_HOST || '127.0.0.1',
    database: process.env.DB_NAME || 'evms_db',
    password: dbPassword,
    port: parseInt(process.env.DB_PORT || '5432', 10),
  });

  return pool;
}
