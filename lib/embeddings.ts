import { Configuration, OpenAIApi } from 'openai';

// Get API key from environment variable
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export class OpenAIEmbeddings {
  private openai: OpenAIApi;

  constructor() {
    const configuration = new Configuration({ apiKey });
    this.openai = new OpenAIApi(configuration);
  }

  /**
   * Generate embeddings for a query string
   */
  async embedQuery(text: string): Promise<number[]> {
    try {
      const response = await this.openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: this.preprocessText(text),
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating query embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for document text
   */
  async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.openai.createEmbedding({
        model: 'text-embedding-ada-002',
        input: this.preprocessText(text),
      });

      return response.data.data[0].embedding;
    } catch (error) {
      console.error('Error generating text embedding:', error);
      throw error;
    }
  }

  /**
   * Preprocess text for embedding
   */
  private preprocessText(text: string): string {
    return text
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .slice(0, 8000); // Truncate to max token length
  }
}