export interface WhatsAppMessage {
  id: string;
  type: string;
  from: string;
  text?: {
    body: string;
  };
}

export interface WhatsAppWebhookBody {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: WhatsAppMessage[];
      };
    }>;
  }>;
}
