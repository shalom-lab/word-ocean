import { useState, useMemo, useEffect, useRef } from 'react';
import { Search, BookOpen, Shuffle, Loader2 } from 'lucide-react';
import type { WordData } from '../types';
import { detectRoot, ROOT_DICTIONARY } from '../utils/wordRoots';
import { getEditDistance } from '../utils/editDistance';
import { formatWordMeaning } from '../utils/dataLoader';
import { getSimilarWordsForWord } from '../utils/similarityLoader';

interface WordAssociatorProps {
  wordData: WordData[];
}

interface WordNode {
  word: string;
  mean: string;
  vector: number[];
  root: string | null;
  color: string;
  data: WordData;
}

interface AssociatedWord {
  word: WordNode;
  type: 'root' | 'semantic' | 'spelling';
  similarity?: number;
}

export default function WordAssociator({ wordData }: WordAssociatorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWord, setSelectedWord] = useState<WordNode | null>(null);
  const [showTypes, setShowTypes] = useState({
    root: true,
    semantic: true,
    spelling: true,
  });
  const hasInitialized = useRef(false); // 标记是否已初始化随机单词

  // 处理单词数据
  const processedWords = useMemo(() => {
    return wordData.map((item): WordNode => {
      const mean = formatWordMeaning(item);
      const root = detectRoot(item.word);
      
      return {
        word: item.word.trim(),
        mean: mean,
        vector: [], // 不再需要向量，保留字段以兼容
        root: root,
        color: root ? ROOT_DICTIONARY[root].color : '#94a3b8',
        data: item,
      };
    });
  }, [wordData]);

  // 创建单词集合用于快速查找
  const wordSet = useMemo(() => {
    return new Set(processedWords.map(w => w.word.toLowerCase()));
  }, [processedWords]);

  // 搜索过滤
  const filteredWords = useMemo(() => {
    if (!searchTerm.trim()) return processedWords.slice(0, 100); // 默认显示前100个
    
    const term = searchTerm.toLowerCase();
    return processedWords
      .filter(w => 
        w.word.toLowerCase().includes(term) || 
        w.mean.includes(term)
      )
      .slice(0, 100);
  }, [processedWords, searchTerm]);

  // 语义相似单词状态
  const [semanticSimilarWords, setSemanticSimilarWords] = useState<AssociatedWord[]>([]);
  const [loadingSimilarity, setLoadingSimilarity] = useState(false);

  // 加载语义相似单词
  useEffect(() => {
    if (!selectedWord || !showTypes.semantic) {
      setSemanticSimilarWords([]);
      setLoadingSimilarity(false);
      return;
    }

    setLoadingSimilarity(true);
    
    // 使用防抖，避免频繁请求
    const timeoutId = setTimeout(() => {
      getSimilarWordsForWord(selectedWord.word, wordSet)
        .then(similarWords => {
          // 创建单词映射用于快速查找
          const wordMap = new Map(processedWords.map(w => [w.word.toLowerCase(), w]));
          
          const semanticAssoc: AssociatedWord[] = similarWords
            .slice(0, 10) // 取前10个
            .map(item => {
              const wordNode = wordMap.get(item.word.toLowerCase());
              if (wordNode) {
                return {
                  word: wordNode,
                  type: 'semantic' as const,
                  similarity: item.similarity,
                } as AssociatedWord;
              }
              return null;
            })
            .filter((item): item is AssociatedWord => item !== null && item !== undefined);
          
          setSemanticSimilarWords(semanticAssoc);
        })
        .catch(error => {
          console.error('加载相似单词失败:', error);
          setSemanticSimilarWords([]);
        })
        .finally(() => {
          setLoadingSimilarity(false);
        });
    }, 100); // 100ms防抖

    return () => clearTimeout(timeoutId);
  }, [selectedWord, showTypes.semantic, wordSet, processedWords]);

  // 获取关联单词
  const associatedWords = useMemo((): AssociatedWord[] => {
    if (!selectedWord) return [];

    const associations: AssociatedWord[] = [];
    const added = new Set<string>([selectedWord.word]);

    // 1. 词根关联
    if (showTypes.root && selectedWord.root) {
      processedWords.forEach(w => {
        if (w.root === selectedWord.root && w.word !== selectedWord.word && !added.has(w.word)) {
          associations.push({ word: w, type: 'root' });
          added.add(w.word);
        }
      });
    }

    // 2. 语义相似（使用预计算数据）
    if (showTypes.semantic) {
      semanticSimilarWords.forEach(assoc => {
        if (!added.has(assoc.word.word)) {
          associations.push(assoc);
          added.add(assoc.word.word);
        }
      });
    }

    // 3. 拼写相似
    if (showTypes.spelling) {
      const spellingAssoc: AssociatedWord[] = [];
      processedWords.forEach(w => {
        if (w.word === selectedWord.word || added.has(w.word)) return;
        
        const dist = getEditDistance(selectedWord.word, w.word);
        if (dist <= 2 && Math.abs(selectedWord.word.length - w.word.length) <= 1 && w.word.length > 3) {
          spellingAssoc.push({ word: w, type: 'spelling' });
        }
      });
      spellingAssoc.slice(0, 8).forEach(a => {
        associations.push(a);
        added.add(a.word.word);
      });
    }

    return associations;
  }, [selectedWord, processedWords, showTypes, semanticSimilarWords]);

  const handleWordClick = (word: WordNode) => {
    setSelectedWord(word);
  };

  const handleRandomWord = () => {
    if (processedWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * processedWords.length);
      setSelectedWord(processedWords[randomIndex]);
    }
  };

  // 初始加载时自动选择随机单词
  useEffect(() => {
    if (processedWords.length > 0 && !hasInitialized.current) {
      const randomIndex = Math.floor(Math.random() * processedWords.length);
      setSelectedWord(processedWords[randomIndex]);
      hasInitialized.current = true;
    }
  }, [processedWords]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'root': return 'border-blue-500 bg-blue-50';
      case 'semantic': return 'border-yellow-500 bg-yellow-50';
      case 'spelling': return 'border-green-500 bg-green-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'root': return '词根';
      case 'semantic': return '语义';
      case 'spelling': return '拼写';
      default: return '';
    }
  };

  // 单词卡片组件 - 统一尺寸
  const WordCard = ({ assoc, onClick }: { assoc: AssociatedWord; onClick: () => void }) => (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-2 cursor-pointer hover:shadow-lg transition-all h-40 flex flex-col ${
        getTypeColor(assoc.type)
      }`}
      onClick={onClick}
      style={{ width: '100%', maxWidth: '100%' }}
    >
      <div className="flex items-start justify-between mb-2 flex-shrink-0">
        <div className="font-bold text-slate-900 text-lg truncate flex-1">
          {assoc.word.word}
        </div>
        <span className={`text-sm px-2 py-1 rounded flex-shrink-0 ml-1 ${
          assoc.type === 'root' ? 'bg-blue-100 text-blue-700' :
          assoc.type === 'semantic' ? 'bg-yellow-100 text-yellow-700' :
          'bg-green-100 text-green-700'
        }`}>
          {getTypeLabel(assoc.type)}
        </span>
      </div>
      <p className="text-base text-slate-600 mb-2 line-clamp-2 flex-1 overflow-hidden">
        {assoc.word.mean}
      </p>
      <div className="flex items-center justify-between mt-auto flex-shrink-0">
        {assoc.similarity && (
          <div className="text-sm text-slate-400">
            相似度: {(assoc.similarity * 100).toFixed(1)}%
          </div>
        )}
        {assoc.word.root && (
          <div className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: assoc.word.color }}
            ></span>
            <span className="text-sm text-slate-400">{assoc.word.root}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 flex-col lg:flex-row">
      {/* 左侧单词列表 - 桌面端显示 */}
      <div className="hidden lg:flex lg:w-80 bg-white border-r shadow-sm flex-col">
        <div className="p-4 border-b">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索单词..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleRandomWord}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
              title="随机单词"
            >
              <Shuffle size={18} />
              <span>随机</span>
            </button>
          </div>
          <div className="text-xs text-slate-500">
            找到 {filteredWords.length} 个单词
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-2 space-y-1">
            {filteredWords.map((word, idx) => (
              <div
                key={idx}
                onClick={() => handleWordClick(word)}
                className={`p-3 rounded-lg cursor-pointer transition-all ${
                  selectedWord?.word === word.word
                    ? 'bg-purple-100 border-2 border-purple-500'
                    : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                }`}
              >
                <div className="font-semibold text-slate-800">{word.word}</div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-1">{word.mean}</div>
                {word.root && (
                  <div className="flex items-center gap-1 mt-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: word.color }}
                    ></span>
                    <span className="text-xs text-slate-400">{word.root}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 中间关联视图 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 移动端顶部工具栏 - 只有随机按钮 */}
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-center">
          <button
            onClick={handleRandomWord}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
            title="随机单词"
          >
            <Shuffle size={20} />
            <span>随机单词</span>
          </button>
        </div>
        {/* 工具栏 */}
        <div className="bg-white border-b px-4 md:px-6 py-2 md:py-3 flex items-center justify-end">
          <div className="flex items-center gap-3 md:gap-4 flex-wrap">
            <span className="text-sm md:text-base font-semibold text-slate-700">显示类型:</span>
            <label className="flex items-center gap-2 text-sm md:text-base">
              <input
                type="checkbox"
                checked={showTypes.root}
                onChange={(e) => setShowTypes({ ...showTypes, root: e.target.checked })}
                className="rounded"
              />
              <span className="text-blue-600">词根</span>
            </label>
            <label className="flex items-center gap-2 text-sm md:text-base">
              <input
                type="checkbox"
                checked={showTypes.semantic}
                onChange={(e) => setShowTypes({ ...showTypes, semantic: e.target.checked })}
                className="rounded"
              />
              <span className="text-yellow-600">语义</span>
            </label>
            <label className="flex items-center gap-2 text-sm md:text-base">
              <input
                type="checkbox"
                checked={showTypes.spelling}
                onChange={(e) => setShowTypes({ ...showTypes, spelling: e.target.checked })}
                className="rounded"
              />
              <span className="text-green-600">拼写</span>
            </label>
          </div>
        </div>

        {/* 主显示区域 - 移动端流式布局，桌面端左右布局 */}
        <div className="flex-1 overflow-y-auto lg:overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100 lg:flex lg:flex-row">
          {selectedWord ? (
            <>
              {/* 移动端：流式布局 - 主单词和关联单词垂直排列 */}
              <div className="lg:hidden w-full">
                {/* 主单词详情 */}
                <div className="bg-white shadow-sm">
                  <div className="p-4 md:p-6">
                    {/* 单词标题区域 - 美化 */}
                    <div className="mb-4 md:mb-6 pb-4 md:pb-6 border-b border-slate-200">
                      <div className="flex items-center gap-3 md:gap-4 mb-3 flex-wrap">
                        <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {selectedWord.word}
                        </h2>
                        {selectedWord.root && (
                          <span
                            className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md"
                            style={{ backgroundColor: selectedWord.color }}
                          >
                            {selectedWord.root}
                          </span>
                        )}
                      </div>
                      <p className="text-lg md:text-xl text-slate-700 font-medium">{selectedWord.mean}</p>
                    </div>
                    
                    {/* 详细释义 */}
                    {selectedWord.data.translations && selectedWord.data.translations.length > 0 && (
                      <div className="mb-4 md:mb-6">
                        <h3 className="text-sm md:text-base font-bold text-slate-700 mb-3 md:mb-4 flex items-center gap-2">
                          <span className="w-1 h-5 bg-purple-600 rounded"></span>
                          详细释义
                        </h3>
                        <div className="space-y-2 md:space-y-3 bg-slate-50 rounded-lg p-3 md:p-4">
                          {selectedWord.data.translations.map((t, i) => (
                            <div key={i} className="text-base text-slate-700">
                              <span className="text-purple-600 font-mono font-semibold bg-purple-50 px-2 py-1 rounded">[{t.type}]</span>{' '}
                              <span className="ml-2">{t.translation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 常用短语 - 响应式布局 */}
                    {selectedWord.data.phrases && selectedWord.data.phrases.length > 0 && (
                      <div className="mb-4 md:mb-6">
                        <h3 className="text-sm md:text-base font-bold text-slate-700 mb-3 md:mb-4 flex items-center gap-2">
                          <span className="w-1 h-5 bg-blue-600 rounded"></span>
                          常用短语
                        </h3>
                        <div className="grid grid-cols-1 gap-3 md:gap-4">
                          {selectedWord.data.phrases.map((p, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                              <div className="font-semibold text-slate-800 mb-2 text-base">{p.phrase}</div>
                              <div className="text-slate-600 text-sm">{p.translation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 关联单词 */}
                {loadingSimilarity && showTypes.semantic ? (
                  <div className="bg-white border-t border-slate-200 p-4 md:p-6">
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">加载相似单词中...</p>
                      </div>
                    </div>
                  </div>
                ) : associatedWords.length > 0 && (
                  <div className="bg-white border-t border-slate-200 p-4 md:p-6">
                    <h3 className="text-base md:text-lg font-bold text-slate-700 mb-4">
                      关联单词 <span className="text-slate-500 font-normal text-sm">({associatedWords.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {associatedWords.map((assoc, idx) => (
                        <WordCard key={idx} assoc={assoc} onClick={() => handleWordClick(assoc.word)} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 桌面端：左右布局 */}
              <>
                {/* 主单词详情 - 桌面端左侧 */}
                <div className="hidden lg:block lg:w-[50%] xl:w-[55%] bg-white border-r shadow-sm overflow-y-auto">
                  <div className="p-6 lg:p-8">
                    {/* 单词标题区域 - 美化 */}
                    <div className="mb-6 pb-6 border-b border-slate-200">
                      <div className="flex items-center gap-4 mb-3 flex-wrap">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {selectedWord.word}
                        </h2>
                        {selectedWord.root && (
                          <span
                            className="px-4 py-2 rounded-full text-sm font-semibold text-white shadow-md"
                            style={{ backgroundColor: selectedWord.color }}
                          >
                            {selectedWord.root}
                          </span>
                        )}
                      </div>
                      <p className="text-xl text-slate-700 font-medium">{selectedWord.mean}</p>
                    </div>
                    
                    {/* 详细释义 */}
                    {selectedWord.data.translations && selectedWord.data.translations.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <span className="w-1 h-5 bg-purple-600 rounded"></span>
                          详细释义
                        </h3>
                        <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                          {selectedWord.data.translations.map((t, i) => (
                            <div key={i} className="text-base text-slate-700">
                              <span className="text-purple-600 font-mono font-semibold bg-purple-50 px-2 py-1 rounded">[{t.type}]</span>{' '}
                              <span className="ml-2">{t.translation}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 常用短语 */}
                    {selectedWord.data.phrases && selectedWord.data.phrases.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-base font-bold text-slate-700 mb-4 flex items-center gap-2">
                          <span className="w-1 h-5 bg-blue-600 rounded"></span>
                          常用短语
                        </h3>
                        <div className="max-h-[400px] overflow-y-auto">
                          <div className="grid grid-cols-2 gap-4">
                            {selectedWord.data.phrases.map((p, i) => (
                              <div key={i} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors">
                                <div className="font-semibold text-slate-800 mb-2 text-base">{p.phrase}</div>
                                <div className="text-slate-600 text-sm">{p.translation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 关联单词 - 桌面端右侧 */}
                <div className="hidden lg:block lg:w-[50%] xl:w-[45%] overflow-y-auto p-6 bg-slate-50">
                  {loadingSimilarity && showTypes.semantic ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Loader2 className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">加载相似单词中...</p>
                      </div>
                    </div>
                  ) : associatedWords.length > 0 ? (
                    <div>
                      <h3 className="text-lg font-bold text-slate-700 mb-4">
                        关联单词 <span className="text-slate-500 font-normal">({associatedWords.length})</span>
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {associatedWords.map((assoc, idx) => (
                          <WordCard key={idx} assoc={assoc} onClick={() => handleWordClick(assoc.word)} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BookOpen className="mx-auto text-slate-400 mb-4" size={48} />
                        <p className="text-slate-500">
                          未找到关联单词，请调整显示类型设置
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="text-center max-w-md">
                <BookOpen className="mx-auto text-slate-400 mb-4" size={64} />
                <p className="text-xl text-slate-500 mb-2">点击随机单词开始探索</p>
                <p className="text-sm text-slate-400 mb-4">
                  或者从左侧列表中选择一个单词（桌面端）
                </p>
                <button
                  onClick={handleRandomWord}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm mx-auto"
                >
                  <Shuffle size={20} />
                  <span>随机单词</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

