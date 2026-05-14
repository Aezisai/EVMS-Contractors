import express from 'express';
import { fetchWithBackoff } from '../shared/apiClient';
import { getSecret } from '../shared/secrets';
import { getDbPool } from '../shared/db';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.post('/ingest/netsuite', async (req, res) => {
  console.log('[NetSuite Connector] Starting ingestion process...');
  
  try {
    // 1. Fetch API credentials securely
    const netsuiteAuth = await getSecret('netsuite_auth_token');
    const netsuiteUrl = process.env.NETSUITE_API_URL || 'https://api.netsuite.com/v1';

    // 2. Ingest Integrated Master Schedule (IMS) & Work Breakdown Structure (WBS)
    console.log('[NetSuite Connector] Fetching IMS & WBS data...');
    const wbsResponse = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${netsuiteUrl}/wbs/schedule`,
      headers: {
        'Authorization': `Bearer ${netsuiteAuth}`,
        'Accept': 'application/json'
      }
    });

    const wbsData = wbsResponse.data;

    // 3. Transform data for budgeted material costs
    const processedWBS = wbsData.map((task: any) => ({
      taskId: task.internalId,
      projectId: task.projectId,
      taskName: task.title,
      budgetedMaterialCost: task.budgetedMaterialCost,
      startDate: task.startDate,
      endDate: task.endDate
    }));

    // 4. Store in the private PostgreSQL database
    const db = await getDbPool();
    // Example transaction (commented out since table structure is not fully defined yet)
    /*
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const task of processedWBS) {
        await client.query(
          'INSERT INTO wbs_schedule (task_id, project_id, task_name, budgeted_material_cost, start_date, end_date) VALUES ($1, $2, $3, $4, $5, $6)',
          [task.taskId, task.projectId, task.taskName, task.budgetedMaterialCost, task.startDate, task.endDate]
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

    console.log(`[NetSuite Connector] Successfully processed ${processedWBS.length} WBS records.`);
    res.status(200).send({ message: 'NetSuite ingestion successful', recordsProcessed: processedWBS.length });

  } catch (error: any) {
    console.error('[NetSuite Connector] Error during ingestion:', error.message);
    res.status(500).send({ error: 'Failed to ingest NetSuite data', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`NetSuite Connector microservice listening on port ${port}`);
});
