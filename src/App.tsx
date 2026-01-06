import { useState, useEffect } from 'react';
import WordAssociator from './components/WordAssociator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { loadDictionary } from './utils/dataLoader';
import { preloadSimilarityData } from './utils/similarityLoader';
import type { WordData, DictionaryName } from './types';
import { BookOpen, Loader2, Github } from 'lucide-react';

const DICTIONARY_NAMES: DictionaryName[] = [
  '1-初中-顺序',
  '2-高中-顺序',
  '3-CET4-顺序',
  '4-CET6-顺序',
  '5-考研-顺序',
  '6-托福-顺序',
  '7-SAT-顺序',
];

const DICTIONARY_LABELS: Record<DictionaryName, string> = {
  '1-初中-顺序': '初中词汇',
  '2-高中-顺序': '高中词汇',
  '3-CET4-顺序': 'CET-4 词汇',
  '4-CET6-顺序': 'CET-6 词汇',
  '5-考研-顺序': '考研词汇',
  '6-托福-顺序': '托福词汇',
  '7-SAT-顺序': 'SAT 词汇',
};

function App() {
  const [selectedDict, setSelectedDict] = useState<DictionaryName>('3-CET4-顺序');
  const [wordData, setWordData] = useState<WordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 并行加载字典数据和相似度数据
        const [data] = await Promise.all([
          loadDictionary(selectedDict),
          preloadSimilarityData(), // 预加载相似度数据（后台加载，不阻塞）
        ]);
        setWordData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载数据失败');
        console.error('加载字典失败:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDict]);

  if (loading && wordData.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-purple-600 mx-auto mb-4" />
          <p className="text-slate-600">正在加载 {DICTIONARY_LABELS[selectedDict]}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg border border-red-200">
          <p className="text-red-600 font-semibold mb-2">加载失败</p>
          <p className="text-slate-600 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部选择栏 */}
      <div className="bg-white border-b shadow-sm px-4 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-purple-600" size={20} />
          <span className="font-semibold text-slate-700">选择单词表:</span>
          <select
            value={selectedDict}
            onChange={(e) => setSelectedDict(e.target.value as DictionaryName)}
            className="px-3 py-1 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {DICTIONARY_NAMES.map((name) => (
              <option key={name} value={name}>
                {DICTIONARY_LABELS[name]}
              </option>
            ))}
          </select>
          {wordData.length > 0 && (
            <span className="text-sm text-slate-500">
              ({wordData.length} 词)
            </span>
          )}
        </div>
        
        <a
          href="https://github.com/shalom-lab/word-ocean"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          title="查看 GitHub 仓库"
        >
          <Github size={20} />
          <span className="text-sm hidden sm:inline">GitHub</span>
        </a>
      </div>

      {/* 单词关联组件 */}
      <div className="flex-1 overflow-hidden">
        {wordData.length > 0 ? (
          <WordAssociator wordData={wordData} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-slate-500">暂无数据</p>
          </div>
        )}
      </div>

      {/* PWA 安装提示 */}
      <PWAInstallPrompt />
    </div>
  );
}

export default App;

