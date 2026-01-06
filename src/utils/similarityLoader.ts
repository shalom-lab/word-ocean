// 相似度数据加载器
// 使用 Service Worker 缓存，主线程直接加载和查询

import { getCache, setCache } from './cacheManager';

export interface SimilarityResult {
  word: string;
  similarity: number;
}

const CACHE_KEY = 'word-top-similar-v1';
let similarityData: Record<string, SimilarityResult[]> | null = null;
let loadingPromise: Promise<Record<string, SimilarityResult[]>> | null = null;

// 加载相似度数据（会被 Service Worker 缓存）
async function loadSimilarityData(): Promise<Record<string, SimilarityResult[]>> {
  if (similarityData) {
    return similarityData;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    const BASE_URL = import.meta.env.BASE_URL || '/';
    const filePath = `${BASE_URL}json/word_top_similar.json`.replace(/\/+/g, '/');

    try {
      console.log('开始加载相似度数据:', filePath);
      // Service Worker 会自动拦截并缓存
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`加载相似度数据失败: ${response.statusText}`);
      }

      const data = await response.json();
      similarityData = data;
      console.log(`相似度数据加载完成，共 ${Object.keys(data).length} 个单词`);
      
      return data;
    } catch (error) {
      console.error('加载相似度数据失败:', error);
      loadingPromise = null; // 失败后重置，允许重试
      throw error;
    }
  })();

  return loadingPromise;
}

// 获取单词的相似单词（已过滤当前单词本范围）
export async function getSimilarWordsForWord(
  word: string,
  wordSet: Set<string>
): Promise<SimilarityResult[]> {
  try {
    // 先尝试从 IndexedDB 缓存查询结果
    const cacheKey = `${CACHE_KEY}-query-${word.toLowerCase()}-${Array.from(wordSet).sort().join(',')}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return cached;
    }

    // 加载数据（Service Worker 已缓存文件）
    const data = await loadSimilarityData();
    const wordLower = word.toLowerCase();
    const similarWords = data[wordLower] || [];
    
    // 过滤：只返回当前单词本中存在的单词，并按相似度排序
    const results = similarWords
      .filter(item => wordSet.has(item.word))
      .sort((a, b) => b.similarity - a.similarity);

    // 缓存查询结果到 IndexedDB
    setCache(cacheKey, results).catch(() => {
      // 忽略缓存错误
    });

    return results;
  } catch (error) {
    console.error('获取相似单词失败:', error);
    return [];
  }
}

// 预加载相似度数据（在应用启动时调用，后台加载）
export async function preloadSimilarityData(): Promise<void> {
  try {
    // 后台加载，不阻塞
    loadSimilarityData().then(() => {
      console.log('相似度数据预加载完成');
    }).catch(err => {
      console.error('预加载失败:', err);
    });
  } catch (error) {
    console.error('预加载相似度数据失败:', error);
  }
}

