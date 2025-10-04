import { useState, useCallback } from 'react';

interface SafetyContentResult {
  content: string;
  sourceFile: string;
  folderPath: string;
  mimeType: string;
  relevanceScore: number;
  fileId: string;
  modifiedTime: string;
}

interface QueryResponse {
  results: SafetyContentResult[];
  query: string;
  totalResults: number;
}

interface UseSafetyContentReturn {
  results: SafetyContentResult[];
  loading: boolean;
  error: string | null;
  queryContent: (query: string, options?: QueryOptions) => Promise<void>;
  clearResults: () => void;
}

interface QueryOptions {
  topK?: number;
  namespace?: string;
  filters?: Record<string, any>;
}

export function useSafetyContent(): UseSafetyContentReturn {
  const [results, setResults] = useState<SafetyContentResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryContent = useCallback(async (
    query: string, 
    options: QueryOptions = {}
  ) => {
    if (!query.trim()) {
      setError('Query cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/query-safety-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          topK: options.topK || 5,
          namespace: options.namespace || 'site',
          filters: options.filters,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: QueryResponse = await response.json();
      setResults(data.results);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to query safety content';
      setError(errorMessage);
      console.error('Error querying safety content:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    queryContent,
    clearResults,
  };
}
