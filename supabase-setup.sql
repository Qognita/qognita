-- Enable the pgvector extension to work with embedding vectors
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table to store document chunks
CREATE TABLE documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  content text NOT NULL,
  embedding vector(1536), -- OpenAI embeddings are 1536 dimensions
  source_url text NOT NULL,
  source_title text NOT NULL,
  chunk_index integer NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create an index for faster similarity searches
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create a function to search for similar documents
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.75,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  content text,
  embedding vector(1536),
  source_url text,
  source_title text,
  chunk_index integer,
  created_at timestamp with time zone,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.embedding,
    documents.source_url,
    documents.source_title,
    documents.chunk_index,
    documents.created_at,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Create RLS policies (optional, for security)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Allow read access to all users (adjust as needed)
CREATE POLICY "Allow read access" ON documents
  FOR SELECT USING (true);

-- Allow insert/update/delete for service role only
CREATE POLICY "Allow full access for service role" ON documents
  FOR ALL USING (auth.role() = 'service_role');
