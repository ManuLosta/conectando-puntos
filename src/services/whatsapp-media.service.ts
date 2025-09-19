const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";

export interface WhatsAppMediaService {
  getMediaUrl(mediaId: string): Promise<string>;
  downloadMedia(mediaUrl: string): Promise<Buffer>;
}

export class WhatsAppMediaServiceImpl implements WhatsAppMediaService {
  async getMediaUrl(mediaId: string): Promise<string> {
    const url = `https://graph.facebook.com/${API_VERSION}/${mediaId}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to get media URL: ${response.status} - ${errorText}`,
        );
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("No URL found in media response");
      }

      return data.url;
    } catch (error) {
      console.error("Error getting media URL:", error);
      throw error;
    }
  }

  async downloadMedia(mediaUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(mediaUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to download media: ${response.status} - ${errorText}`,
        );
      }

      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error) {
      console.error("Error downloading media:", error);
      throw error;
    }
  }
}

export const whatsAppMediaService = new WhatsAppMediaServiceImpl();
