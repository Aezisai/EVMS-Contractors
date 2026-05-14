import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub();
const TOPIC_NAME = process.env.PUBSUB_ALERTS_TOPIC || 'evm-alerts';

export async function publishEvmAlert(caId: string, caCode: string, spi: number, cpi: number) {
  try {
    const topic = pubsub.topic(TOPIC_NAME);
    
    const payload = {
      timestamp: new Date().toISOString(),
      controlAccountId: caId,
      controlAccountCode: caCode,
      metrics: {
        SPI: spi,
        CPI: cpi
      },
      message: `URGENT: EVM Metrics for Control Account ${caCode} have fallen below the 0.90 threshold. SPI: ${spi.toFixed(2)}, CPI: ${cpi.toFixed(2)}`,
      severity: 'HIGH'
    };

    const dataBuffer = Buffer.from(JSON.stringify(payload));
    const messageId = await topic.publishMessage({ data: dataBuffer });
    
    console.log(`[Alerts] Published performance alert for ${caCode}. Message ID: ${messageId}`);
  } catch (error: any) {
    console.error(`[Alerts] Failed to publish alert for ${caCode}:`, error.message);
  }
}
