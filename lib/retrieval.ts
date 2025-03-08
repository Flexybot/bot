import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { VectorSearchFilter } from '@supabase/supabase-js';

// Get environment variables
const apiKey = process.env.OPENAI_API_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!apiKey) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Initialize Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface Document {
  id: string;
  content: string;
  title?: string;
  metadata?: any;
  similarity?: number;
}

export async function retrieveDocuments(
  query: string,
  organizationId: string,
  chatbotId?: string,
  limit: number = 5,
  similarityThreshold: number = 0.7
): Promise<Document[]> {
  try {
    // Generate embedding for the query
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });
    
    const queryEmbedding = embeddingResponse.data[0].embedding;
    
    // Build match query
    const matchQuery = {
      query_embedding: queryEmbedding,
      match_threshold: similarityThreshold,
      match_count: limit,
      filter_conditions: [
        { name: 'organization_id', operator: 'eq', value: organizationId }
      ] as VectorSearchFilter[]
    };
    
    // Add chatbot filter if provided
    if (chatbotId) {
      matchQuery.filter_conditions.push({
        name: 'chatbot_id',
        operator: 'eq',
        value: chatbotId
      });
    }
    
    // Query Supabase for similar documents
    const { data: documents, error } = await supabase.rpc(
      'match_documents',
      matchQuery
    );
    
    if (error) {
      console.error('Error retrieving documents:', error);
      return [];
    }
    
    // Format and return results
    return documents.map((doc: any) => ({
      id: doc.id,
      content: doc.content,
      title: doc.title || 'Untitled Document',
      metadata: doc.metadata,
      similarity: doc.similarity
    }));
  } catch (error) {
    console.error('Error in document retrieval:', error);
    return [];
  }
}

export async function processDocument(
  content: string,
  metadata: {
    organization_id: string;
    chatbot_id?: string;
    title?: string;
    type?: string;
    source_url?: string;
  }
): Promise<boolean> {
  try {
    // Generate embedding for the document
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    });
    
    const embedding = embeddingResponse.data[0].embedding;
    
    // Store document and embedding in Supabase
    const { error } = await supabase
      .from('documents')
      .insert({
        content,
        embedding,
        ...metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('Error storing document:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error processing document:', error);
    return false;
  }
}

export function splitDocument(
  text: string,
  maxChunkSize: number = 1500,
  overlap: number = 200
): string[] {
  const chunks: string[] = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    // Calculate end index for this chunk
    let endIndex = startIndex + maxChunkSize;
    
    if (endIndex > text.length) {
      endIndex = text.length;
    } else {
      // Try to find a natural break point
      const nextParagraph = text.indexOf('\n\n', endIndex - overlap);
      const nextSentence = text.indexOf('. ', endIndex - overlap);
      
      if (nextParagraph !== -1 && nextParagraph < endIndex + overlap) {
        endIndex = nextParagraph;
      } else if (nextSentence !== -1 && nextSentence < endIndex + overlap) {
        endIndex = nextSentence + 2; // Include the period and space
      } else {
        // If no natural break found, break at the last space
        const lastSpace = text.lastIndexOf(' ', endIndex);
        if (lastSpace > startIndex) {
          endIndex = lastSpace;
        }
      }
    }
    
    // Add chunk to array
    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    
    // Move start index for next chunk, accounting for overlap
    startIndex = endIndex - overlap;
  }
  
  return chunks;
}

export function preprocessText(text: string): string {
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\S\r\n]+/g, ' ') // Replace multiple spaces (but not newlines) with single space
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ consecutive newlines with 2
    .trim();
}

export async function processWebpage(url: string, metadata: any): Promise<boolean> {
  try {
    // Fetch webpage content
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract text content (basic implementation)
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    
    // Preprocess and split text
    const cleanText = preprocessText(text);
    const chunks = splitDocument(cleanText);
    
    // Process each chunk
    for (const chunk of chunks) {
      const success = await processDocument(chunk, {
        ...metadata,
        source_url: url,
        type: 'webpage'
      });
      
      if (!success) {
        console.error('Failed to process chunk');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error processing webpage:', error);
    return false;
  }
}