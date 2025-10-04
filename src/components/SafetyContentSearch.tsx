'use client';

import React, { useState } from 'react';
import { useSafetyContent } from '@/hooks/useSafetyContent';

interface SafetyContentSearchProps {
  onResults?: (results: any[]) => void;
  placeholder?: string;
  className?: string;
}

export default function SafetyContentSearch({ 
  onResults, 
  placeholder = "Ask about safety training requirements...",
  className = ""
}: SafetyContentSearchProps) {
  const [query, setQuery] = useState('');
  const { results, loading, error, queryContent, clearResults } = useSafetyContent();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    await queryContent(query);
    if (onResults) {
      onResults(results);
    }
  };

  const handleClear = () => {
    setQuery('');
    clearResults();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          {results.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">❌ {error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Searching safety content...</span>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Found {results.length} relevant results
            </h3>
          </div>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {result.sourceFile}
                    </h4>
                    <p className="text-sm text-gray-500">
                      📁 {result.folderPath}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {Math.round(result.relevanceScore * 100)}% match
                    </span>
                  </div>
                </div>
                
                <div className="text-gray-700 text-sm leading-relaxed">
                  {result.content.length > 300 
                    ? `${result.content.substring(0, 300)}...` 
                    : result.content
                  }
                </div>
                
                <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                  <span>📄 {result.mimeType}</span>
                  <span>🕒 {new Date(result.modifiedTime).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Results */}
      {!loading && results.length === 0 && query && !error && (
        <div className="text-center py-8">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try different keywords or check if the content has been ingested.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
