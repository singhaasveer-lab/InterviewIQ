import React, { useState } from 'react';
import {
  Code2,
  Sparkles,
  Play,
  Send,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  HardDrive,
  Award,
  Layers,
} from 'lucide-react';
import { TabType, CodingEvaluation } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';

interface CodingInterviewViewProps {
  setActiveTab: (tab: TabType) => void;
}

interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  initialCode: Record<string, string>;
}

const PROBLEMS: Problem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    initialCode: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Your solution here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
      javascript: `function twoSum(nums, target) {
  // Your solution here
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Your solution here
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                return {seen[complement], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
    },
  },
  {
    id: 'lru-cache',
    title: 'LRU Cache Design',
    difficulty: 'Medium',
    description: `Design a data structure that follows the constraints of a Least Recently Used (LRU) cache.

Implement the \`LRUCache\` class:
- \`LRUCache(int capacity)\` Initialize the LRU cache with positive size capacity.
- \`int get(int key)\` Return the value of the key if it exists, otherwise return -1.
- \`void put(int key, int value)\` Update the value of key if key exists. Otherwise, add key-value to cache. If capacity exceeded, evict the least recently used key.`,
    examples: [
      {
        input: '["LRUCache", "put", "put", "get", "put", "get", "put", "get", "get", "get"]\n[[2], [1, 1], [2, 2], [1], [3, 3], [2], [4, 4], [1], [3], [4]]',
        output: '[null, null, null, 1, null, -1, null, -1, 3, 4]',
      },
    ],
    constraints: [
      '1 <= capacity <= 3000',
      '0 <= key <= 10^4',
      '0 <= value <= 10^5',
      'At most 2 * 10^5 calls will be made to get and put.',
    ],
    initialCode: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        # Implement with doubly linked list + hash map

    def get(self, key: int) -> int:
        return -1

    def put(self, key: int, value: int) -> None:
        pass`,
      javascript: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return -1;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }
}`,
      java: `class LRUCache {
    public LRUCache(int capacity) {}
    public int get(int key) { return -1; }
    public void put(int key, int value) {}
}`,
      cpp: `class LRUCache {
public:
    LRUCache(int capacity) {}
    int get(int key) { return -1; }
    void put(int key, int value) {}
};`,
    },
  },
];

export const CodingInterviewView: React.FC<CodingInterviewViewProps> = ({ setActiveTab }) => {
  const { showToast } = useToast();

  const [selectedProblem, setSelectedProblem] = useState<Problem>(PROBLEMS[0]);
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState<string>(PROBLEMS[0].initialCode['python']);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<CodingEvaluation | null>(null);

  const handleSelectProblem = (prob: Problem) => {
    setSelectedProblem(prob);
    setCode(prob.initialCode[language] || prob.initialCode['python']);
    setEvaluation(null);
  };

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(selectedProblem.initialCode[newLang] || '');
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      showToast('Please write code before submitting.', 'error');
      return;
    }

    try {
      setIsEvaluating(true);
      showToast('Compiling solution and testing edge cases with AI...', 'info');

      const data = await api.evaluateCode({
        problem_id: selectedProblem.id,
        title: selectedProblem.title,
        language,
        code,
        problem_statement: selectedProblem.description,
      });

      setEvaluation(data);
      showToast(`Coding Evaluation Complete! Score: ${data.score}%`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Coding evaluation failed.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-3">
          <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interactive Code Sandbox & Complexity Judge</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Technical Coding Practice Sandbox
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Solve data structure and algorithmic challenges. Gemini analyzes correctness, Big-O time and space
          complexity, code cleanliness, and hidden edge cases.
        </p>
      </div>

      {/* Problem Selection Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PROBLEMS.map((p) => (
          <button
            key={p.id}
            onClick={() => handleSelectProblem(p)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-2 border ${
              selectedProblem.id === p.id
                ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                : 'bg-white/[0.03] border-white/5 text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
          >
            <span>{p.title}</span>
            <span
              className={`text-[9px] uppercase px-1.5 py-0.5 rounded ${
                p.difficulty === 'Easy'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}
            >
              {p.difficulty}
            </span>
          </button>
        ))}
      </div>

      {/* Editor & Problem Statement Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side (5 Cols): Problem Description */}
        <div className="lg:col-span-5 p-6 rounded-3xl glass-panel border border-white/10 space-y-5 overflow-y-auto max-h-[650px]">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  selectedProblem.difficulty === 'Easy'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedProblem.difficulty}
              </span>
            </div>
            <h3 className="text-xl font-bold text-white">{selectedProblem.title}</h3>
          </div>

          <div className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
            {selectedProblem.description}
          </div>

          {/* Examples */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Examples</h4>
            {selectedProblem.examples.map((ex, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 text-xs font-mono space-y-1">
                <p className="text-slate-400">
                  <strong className="text-purple-300">Input:</strong> {ex.input}
                </p>
                <p className="text-slate-400">
                  <strong className="text-cyan-300">Output:</strong> {ex.output}
                </p>
                {ex.explanation && (
                  <p className="text-slate-500 text-[11px] font-sans mt-1">
                    {ex.explanation}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Constraints */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Constraints</h4>
            <ul className="space-y-1 text-xs text-slate-400 font-mono">
              {selectedProblem.constraints.map((c, i) => (
                <li key={i} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Side (7 Cols): Code Editor & Actions */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-3xl glass-panel-glow border border-white/10 space-y-4">
            {/* Editor Toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Language:</span>
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-3 py-1.5 rounded-lg glass-input text-xs font-bold text-cyan-300 focus:outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (ESNext)</option>
                  <option value="java">Java 17</option>
                  <option value="cpp">C++ 20</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isEvaluating}
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isEvaluating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Judging Solution...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>RUN & EVALUATE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Code Input Textarea */}
            <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-slate-950/80">
              <textarea
                rows={16}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck={false}
                className="w-full p-4 font-mono text-xs sm:text-sm text-cyan-200 bg-transparent focus:outline-none resize-y leading-relaxed"
              />
            </div>
          </div>

          {/* AI Evaluation Results Panel */}
          {evaluation && (
            <div className="p-6 rounded-3xl glass-panel border border-cyan-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-400" />
                  <h4 className="font-bold text-base text-white">AI Complexity & Quality Judge</h4>
                </div>
                <span className="text-sm font-extrabold px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Score: {evaluation.score}/100
                </span>
              </div>

              {/* Big-O Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Time Complexity
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluation.time_complexity}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Space Complexity
                  </span>
                  <span className="font-mono font-bold text-white">
                    {evaluation.space_complexity}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    All Tests Passed
                  </span>
                  <span
                    className={`font-bold ${
                      evaluation.passed_all_tests ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {evaluation.passed_all_tests ? 'YES' : 'PARTIAL'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">
                    Code Quality
                  </span>
                  <span className="text-slate-300 truncate block">Clean & Idiomatic</span>
                </div>
              </div>

              {/* Test Cases */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                  Test Case Results
                </span>
                <div className="space-y-1.5">
                  {evaluation.test_cases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {tc.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span className="text-slate-300 truncate max-w-[280px]">{tc.input}</span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          tc.passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {tc.passed ? 'PASSED' : 'FAILED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Edge Cases Missed */}
              {evaluation.edge_cases_missed.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 space-y-1">
                  <span className="font-bold block">Edge Cases to Consider:</span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-300/90">
                    {evaluation.edge_cases_missed.map((ec, i) => (
                      <li key={i}>{ec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
