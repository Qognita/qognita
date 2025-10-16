import { openai } from '@/lib/openai';
import { supabaseAdmin, DocumentMatch } from '@/lib/supabase';

export class KnowledgeService {
  // Generate embedding for a text using OpenAI
  static async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: text.replace(/\n/g, ' '), // Clean up text
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Search the knowledge base for relevant documents
   */
  static async searchKnowledgeBase(
    query: string,
    matchCount: number = 5,
    threshold: number = 0.6
  ): Promise<DocumentMatch[]> {
    try {
      // 1. Generate embedding for the query
      const queryEmbedding = await this.getEmbedding(query);

      // 2. Search for similar documents using the match_documents function
      const { data, error } = await supabaseAdmin.rpc('match_documents', {
        query_embedding: queryEmbedding,
        match_threshold: threshold,
        match_count: matchCount,
      });

      if (error) {
        console.error('Error searching knowledge base:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Knowledge base search failed:', error);
      return [];
    }
  }

  /**
   * Store a document chunk in the knowledge base
   */
  static async storeChunk(
    content: string,
    sourceUrl: string,
    sourceTitle: string,
    chunkIndex: number
  ): Promise<boolean> {
    try {
      // Generate embedding for the content
      const embedding = await this.getEmbedding(content);

      // Store in database
      const { error } = await supabaseAdmin.from('documents').insert({
        content,
        embedding,
        source_url: sourceUrl,
        source_title: sourceTitle,
        chunk_index: chunkIndex,
      });

      if (error) {
        console.error('Error storing document chunk:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to store chunk:', error);
      return false;
    }
  }

  /**
   * Check if we have documents for a specific source
   */
  static async hasDocuments(sourceUrl: string): Promise<boolean> {
    try {
      const { count, error } = await supabaseAdmin
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('source_url', sourceUrl);

      if (error) {
        console.error('Error checking documents:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Failed to check documents:', error);
      return false;
    }
  }

  /**
   * Clear all documents for a specific source (useful for re-ingestion)
   */
  static async clearSource(sourceUrl: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin.from('documents').delete().eq('source_url', sourceUrl);

      if (error) {
        console.error('Error clearing source:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to clear source:', error);
      return false;
    }
  }
}
