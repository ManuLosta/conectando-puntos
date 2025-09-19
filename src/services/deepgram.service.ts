import { createClient } from "@deepgram/sdk";
import type { SyncPrerecordedResponse } from "@deepgram/sdk";

export interface DeepgramService {
  transcribeAudioFromUrl(audioUrl: string): Promise<string>;
  transcribeAudioFromBuffer(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<string>;
}

export class DeepgramServiceImpl implements DeepgramService {
  private client;

  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY environment variable is required");
    }
    this.client = createClient(apiKey);
  }

  async transcribeAudioFromUrl(audioUrl: string): Promise<string> {
    try {
      const { result } = await this.client.listen.prerecorded.transcribeUrl(
        { url: audioUrl },
        {
          model: "nova-3",
          language: "es",
          smart_format: true,
          punctuate: true,
          diarize: false,
        },
      );

      if (!result) {
        throw new Error("No result received from Deepgram");
      }
      return this.extractTranscriptText(result);
    } catch (error) {
      console.error("Error transcribing audio from URL:", error);
      throw new Error("Failed to transcribe audio from URL");
    }
  }

  async transcribeAudioFromBuffer(
    audioBuffer: Buffer,
    mimeType: string,
  ): Promise<string> {
    try {
      const { result } = await this.client.listen.prerecorded.transcribeFile(
        audioBuffer,
        {
          model: "nova-3",
          language: "es",
          smart_format: true,
          punctuate: true,
          diarize: false,
          mimetype: mimeType,
        },
      );

      if (!result) {
        throw new Error("No result received from Deepgram");
      }
      return this.extractTranscriptText(result);
    } catch (error) {
      console.error("Error transcribing audio from buffer:", error);
      throw new Error("Failed to transcribe audio from buffer");
    }
  }

  private extractTranscriptText(result: SyncPrerecordedResponse): string {
    if (!result.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      throw new Error("No transcript found in Deepgram response");
    }

    const transcript =
      result.results.channels[0].alternatives[0].transcript.trim();

    if (!transcript || transcript.length === 0) {
      throw new Error("Empty transcript received from Deepgram");
    }

    return transcript;
  }
}

export const deepgramService = new DeepgramServiceImpl();
