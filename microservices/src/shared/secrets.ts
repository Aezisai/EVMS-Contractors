import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(secretName: string): Promise<string> {
  // If running locally, you might want to use process.env for local development testing
  if (process.env.NODE_ENV !== 'production' && process.env[secretName]) {
    return process.env[secretName] as string;
  }

  try {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT || 'evms-495723';
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`;
    
    const [version] = await client.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    
    if (!payload) {
      throw new Error(`Secret payload for ${secretName} is empty.`);
    }
    
    return payload;
  } catch (error) {
    console.error(`[Secrets] Failed to fetch secret ${secretName}:`, error);
    throw error;
  }
}
