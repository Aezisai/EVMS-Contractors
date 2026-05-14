import express from 'express';
import { fetchWithBackoff } from '../shared/apiClient';
import { getSecret } from '../shared/secrets';
import { getDbPool } from '../shared/db';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.post('/ingest/unanet', async (req, res) => {
  console.log('[Unanet Connector] Starting ingestion process...');
  
  try {
    // 1. Fetch API credentials securely
    const unanetApiKey = await getSecret('unanet_api_key');
    const unanetUrl = process.env.UNANET_API_URL || 'https://api.unanet.com/v1';

    // 2. Pull Timekeeping & Labor Hours
    console.log('[Unanet Connector] Fetching labor hours...');
    const laborResponse = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${unanetUrl}/labor/hours`,
      headers: {
        'Authorization': `Bearer ${unanetApiKey}`,
        'Accept': 'application/json'
      }
    });

    const laborData = laborResponse.data;

    // 3. Transform data for ACWP (Actual Cost of Work Performed)
    // (In a real app, complex data transformation logic goes here)
    const processedLabor = laborData.map((entry: any) => ({
      projectId: entry.projectId,
      employeeId: entry.employeeId,
      hours: entry.hours,
      cost: entry.cost,
      date: entry.date
    }));

    // 4. Store in the private PostgreSQL database
    const db = await getDbPool();
    // Example transaction (commented out since table structure is not fully defined yet)
    /*
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const labor of processedLabor) {
        await client.query(
          'INSERT INTO labor_actuals (project_id, employee_id, hours, cost, date) VALUES ($1, $2, $3, $4, $5)',
          [labor.projectId, labor.employeeId, labor.hours, labor.cost, labor.date]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    */

    console.log(`[Unanet Connector] Successfully processed ${processedLabor.length} labor records.`);
    res.status(200).send({ message: 'Unanet ingestion successful', recordsProcessed: processedLabor.length });

  } catch (error: any) {
    console.error('[Unanet Connector] Error during ingestion:', error.message);
    res.status(500).send({ error: 'Failed to ingest Unanet data', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Unanet Connector microservice listening on port ${port}`);
});
