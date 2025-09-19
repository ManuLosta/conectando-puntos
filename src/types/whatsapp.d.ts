export interface WhatsAppMessage {
  id: string;
  type: string;
  from: string;
  text?: {
    body: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  voice?: {
    id: string;
    mime_type: string;
  };
  interactive?: {
    type: string;
    button_reply?: {
      id: string;
      title: string;
    };
    list_reply?: {
      id: string;
      title: string;
      description?: string;
    };
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

export interface WhatsAppInteractiveMessage {
  type: "button" | "list";
  header?: {
    type: "text";
    text: string;
  };
  body: {
    text: string;
  };
  footer?: {
    text: string;
  };
  action: ButtonAction | ListAction;
}

export interface ButtonAction {
  buttons: Array<{
    type: "reply";
    reply: {
      id: string;
      title: string;
    };
  }>;
}

export interface ListAction {
  button: string;
  sections: Array<{
    title?: string;
    rows: Array<{
      id: string;
      title: string;
      description?: string;
    }>;
  }>;
}

export interface WhatsAppFormattedResponse {
  messaging_product: "whatsapp";
  to: string;
  type: "text" | "interactive";
  text?: {
    body: string;
  };
  interactive?: WhatsAppInteractiveMessage;
}
