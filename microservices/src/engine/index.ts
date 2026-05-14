import express from 'express';
import { getDbPool } from '../shared/db';
import { publishEvmAlert } from './alerts';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// For this engine to calculate metrics, it needs physical percent complete.
// In a real system, this would be queried from the database. We will use a mock function for now.
const getEarnedValue = async (bac: number): Promise<number> => {
  // Mock: Assume 50% physical percent complete for testing purposes
  const percentComplete = 0.50; 
  return bac * percentComplete;
};

app.post('/calculate', async (req, res) => {
  console.log('[EVM Engine] Starting daily EVM calculations...');
  
  try {
    const db = await getDbPool();
    const client = await db.connect();

    try {
      // 1. Fetch all Control Accounts
      const caQuery = await client.query('SELECT ca_id, ca_code FROM control_accounts');
      const controlAccounts = caQuery.rows;

      const results = [];

      for (const ca of controlAccounts) {
        console.log(`[EVM Engine] Processing CA: ${ca.ca_code}`);

        // 2. Calculate Total ACWP (Actual Cost of Work Performed)
        // Combine Unanet Labor Actuals + QuickBooks Financial Actuals
        // (Mocking the query structure since the actual tables might differ in a full prod setup)
        // const acwpQuery = await client.query(`
        //   SELECT SUM(cost) as total_acwp FROM (
        //     SELECT cost FROM labor_actuals WHERE project_id IN (SELECT project_id FROM control_accounts WHERE ca_id = $1)
        //     UNION ALL
        //     SELECT total_amount FROM financial_expenses WHERE project_id IN (SELECT project_id FROM control_accounts WHERE ca_id = $1)
        //   ) as combined_actuals
        // `, [ca.ca_id]);
        
        // Mocking ACWP and BCWS for demonstration:
        const acwp = 12000; // Simulated ACWP from DB
        
        // 3. Get BCWS (Budgeted Cost for Work Scheduled) from time_phased_budgets
        const bcws = 10000; // Simulated BCWS from DB
        
        // 4. Get BAC (Budget at Completion) - total of all planned budgets
        const bac = 20000; // Simulated total budget

        // 5. Calculate BCWP (Earned Value)
        const bcwp = await getEarnedValue(bac); // e.g., 20000 * 0.5 = 10000

        // 6. Calculate Variances
        const sv = bcwp - bcws;
        const cv = bcwp - acwp;

        // 7. Calculate Indices
        // Protect against division by zero
        const spi = bcws > 0 ? bcwp / bcws : 1;
        const cpi = acwp > 0 ? bcwp / acwp : 1;

        // 8. Calculate Estimates
        const etc = cpi > 0 ? (bac - bcwp) / cpi : 0;
        const eac = acwp + etc;

        const metrics = {
          caId: ca.ca_id,
          caCode: ca.ca_code,
          ACWP: acwp,
          BCWS: bcws,
          BCWP: bcwp,
          SV: sv,
          CV: cv,
          SPI: Number(spi.toFixed(2)),
          CPI: Number(cpi.toFixed(2)),
          ETC: Number(etc.toFixed(2)),
          EAC: Number(eac.toFixed(2))
        };

        results.push(metrics);

        // 9. Alerting Logic
        if (metrics.SPI < 0.90 || metrics.CPI < 0.90) {
          await publishEvmAlert(ca.ca_id, ca.ca_code, metrics.SPI, metrics.CPI);
        }
      }

      console.log(`[EVM Engine] Successfully calculated metrics for ${results.length} Control Accounts.`);
      res.status(200).send({ message: 'EVM Calculation Complete', results });

    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[EVM Engine] Error during calculation:', error.message);
    res.status(500).send({ error: 'Failed to calculate EVM metrics', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`EVM Engine microservice listening on port ${port}`);
});
