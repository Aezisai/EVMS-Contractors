import express from 'express';
import { fetchWithBackoff } from '../shared/apiClient';
import { getSecret } from '../shared/secrets';
import { getDbPool } from '../shared/db';

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

app.post('/ingest/quickbooks', async (req, res) => {
  console.log('[QuickBooks Connector] Starting ingestion process...');
  
  try {
    // 1. Fetch API credentials securely
    const qbOAuthToken = await getSecret('quickbooks_oauth');
    const qbUrl = process.env.QUICKBOOKS_API_URL || 'https://quickbooks.api.intuit.com/v3/company';
    const companyId = process.env.QUICKBOOKS_COMPANY_ID;

    if (!companyId) {
      throw new Error('QUICKBOOKS_COMPANY_ID environment variable is missing.');
    }

    // 2. Pull actual indirect costs, overhead, and direct material expenses
    console.log('[QuickBooks Connector] Fetching financial expenses...');
    const expensesResponse = await fetchWithBackoff<any>({
      method: 'GET',
      url: `${qbUrl}/${companyId}/query?query=select * from Purchases`,
      headers: {
        'Authorization': `Bearer ${qbOAuthToken}`,
        'Accept': 'application/json'
      }
    });

    const expensesData = expensesResponse.data?.QueryResponse?.Purchases || [];

    // 3. Transform data to complete the ACWP calculation
    const processedExpenses = expensesData.map((expense: any) => ({
      expenseId: expense.Id,
      totalAmount: expense.TotalAmt,
      paymentType: expense.PaymentType,
      transactionDate: expense.TxnDate,
      // Map to project/WBS if available in QuickBooks line items
      projectId: expense.Line?.[0]?.AccountRef?.value || null
    }));

    // 4. Store in the private PostgreSQL database
    const db = await getDbPool();
    // Example transaction (commented out since table structure is not fully defined yet)
    /*
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const expense of processedExpenses) {
        await client.query(
          'INSERT INTO financial_expenses (expense_id, total_amount, payment_type, transaction_date, project_id) VALUES ($1, $2, $3, $4, $5)',
          [expense.expenseId, expense.totalAmount, expense.paymentType, expense.transactionDate, expense.projectId]
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

    console.log(`[QuickBooks Connector] Successfully processed ${processedExpenses.length} expense records.`);
    res.status(200).send({ message: 'QuickBooks ingestion successful', recordsProcessed: processedExpenses.length });

  } catch (error: any) {
    console.error('[QuickBooks Connector] Error during ingestion:', error.message);
    res.status(500).send({ error: 'Failed to ingest QuickBooks data', details: error.message });
  }
});

app.listen(port, () => {
  console.log(`QuickBooks Connector microservice listening on port ${port}`);
});
