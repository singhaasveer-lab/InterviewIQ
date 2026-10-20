import React, { useState, useEffect } from 'react';
import {
  Database,
  Sparkles,
  Upload,
  Search,
  FileText,
  Layers,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { TabType, RAGDoc, RAGSearchResult } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface RAGKnowledgeViewProps {
  setActiveTab: (tab: TabType) => void;
}

export const RAGKnowledgeView: React.FC<RAGKnowledgeViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  const [docs, setDocs] = useState<RAGDoc[]>([]);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<'study_notes' | 'resume' | 'job_description' | 'company_info'>('study_notes');
  const [docContent, setDocContent] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RAGSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadDocs();
  }, []);

  const loadDocs = async () => {
    try {
      const data = await api.getRAGDocs();
      setDocs(data);
    } catch {
      // ignore
    }
  };

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) {
      showToast('Please provide a document title and content.', 'error');
      return;
    }

    try {
      setIsIngesting(true);
      showToast('Chunking text and indexing vector embeddings...', 'info');

      await api.uploadRAGDoc({
        title: docTitle,
        content: docContent,
        category: docCategory,
      });

      showToast(`Document "${docTitle}" successfully ingested into RAG store!`, 'success');
      setDocTitle('');
      setDocContent('');
      loadDocs();
    } catch (err: any) {
      showToast(err.message || 'Ingestion failed.', 'error');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await api.searchRAG(searchQuery, 5);
      setSearchResults(res.results);
      if (res.results.length === 0) {
        showToast('No relevant chunks found for query.', 'info');
      } else {
        showToast(`Retrieved ${res.results.length} relevant context chunks!`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Search failed.', 'error');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Vector Embeddings & Semantic Retrieval</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          RAG Knowledge Vault & Grounding
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload custom interview notes, system design blueprints, or target company dossiers.
          Our RAG pipeline extracts text, chunks into semantic vectors, and grounds your AI interviews.
        </p>
      </div>

      {/* 2-Column Grid: Upload/Ingest Form & Search Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Ingestion Form */}
        <div className="p-6 rounded-3xl glass-panel-glow border border-white/10 space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Ingest Document into Vector Store</span>
          </h3>

          <form onSubmit={handleIngest} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Document Title
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Consensus Notes (Raft/Paxos)"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Document Category
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'study_notes', label: 'Study Notes' },
                  { id: 'resume', label: 'Candidate Resume' },
                  { id: 'job_description', label: 'Job Spec' },
                  { id: 'company_info', label: 'Company Info' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setDocCategory(cat.id as any)}
                    className={`py-2 px-2.5 rounded-xl border text-center font-medium transition ${
                      docCategory === cat.id
                        ? 'bg-cyan-600/30 border-cyan-500 text-white'
                        : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Document Body / Knowledge Text
              </label>
              <textarea
                rows={6}
                placeholder="Paste technical documentation, interview prep answers, or company architectural principles..."
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full p-3.5 rounded-2xl glass-input text-xs font-mono leading-relaxed placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={isIngesting}
              className="w-full py-3 rounded-xl font-bold text-xs bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isIngesting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Chunks & Vectors...</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" />
                  <span>CHUNK & STORE IN PGVECTOR</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Semantic Similarity Search Tester */}
        <div className="p-6 rounded-3xl glass-panel-glow border border-white/10 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2 mb-1">
              <Search className="w-4 h-4 text-purple-400" />
              <span>Semantic Similarity Vector Query</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Test cosine similarity search across your vector chunk store in real-time.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="e.g. How does Raft handle leader election splits?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-xl glass-input text-xs sm:text-sm focus:outline-none focus:border-purple-500 transition"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-500 text-white transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>
            </form>

            {/* Results Preview */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {searchResults.length > 0 ? (
                searchResults.map((res, i) => (
                  <div
                    key={i}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white truncate max-w-[200px]">
                        {res.docTitle}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        {res.score}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed font-mono">
                      {res.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center rounded-2xl bg-white/[0.01] border border-dashed border-white/5">
                  <p className="text-xs text-slate-400">
                    Query the knowledge base to inspect matching semantic chunks.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-white/5">
            <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>pgvector cosine distance indexing active</span>
            </span>
          </div>
        </div>
      </div>

      {/* Indexed Documents Table */}
      <div className="p-6 sm:p-8 rounded-3xl glass-panel border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>Currently Ingested Documents ({docs.length})</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {doc.category.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {doc.chunkCount} Chunks
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-white line-clamp-2 mb-1">
                  {doc.title}
                </h4>
              </div>
              <p className="text-[10px] text-slate-500 mt-2">
                Ingested {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
