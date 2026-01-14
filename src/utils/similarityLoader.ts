// 获取 Vite 的 base URL（处理子路径部署）
const BASE_URL = import.meta.env.BASE_URL || '/';

interface SimilarWord {
  word: string;
  similarity: number;
}

// 相似度数据缓存
let similarityData: Record<string, SimilarWord[]> | null = null;
let isLoading = false;
let loadPromise: Promise<Record<string, SimilarWord[]>> | null = null;

/**
 * 预加载相似度数据
 */
export async function preloadSimilarityData(): Promise<void> {
  if (similarityData !== null) {
    return; // 已经加载过了
  }

  if (isLoading && loadPromise) {
    return loadPromise.then(() => {}); // 正在加载，等待完成
  }

  isLoading = true;
  loadPromise = (async () => {
    try {
      const filePath = `${BASE_URL}json/word_top_similar.json`.replace(/\/+/g, '/');
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`加载相似度数据失败: ${response.statusText}`);
      }
      
      const data: Record<string, SimilarWord[]> = await response.json();
      similarityData = data;
      return data;
    } catch (error) {
      console.error('加载相似度数据时出错:', error);
      similarityData = {}; // 设置为空对象，避免重复加载
      throw error;
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise.then(() => {});
}

/**
 * 获取指定单词的相似单词列表
 * @param word 单词
 * @param wordSet 可用单词集合（用于过滤）
 * @returns 相似单词列表，按相似度降序排列
 */
export async function getSimilarWordsForWord(
  word: string,
  wordSet: Set<string>
): Promise<SimilarWord[]> {
  // 确保数据已加载
  if (similarityData === null) {
    await preloadSimilarityData();
  }

  if (!similarityData) {
    return [];
  }

  // 查找单词的相似单词（使用小写）
  const wordKey = word.toLowerCase();
  const similarWords = similarityData[wordKey] || [];

  // 过滤出在 wordSet 中存在的单词，并去重
  const filtered: SimilarWord[] = [];
  const seen = new Set<string>();

  for (const item of similarWords) {
    const lowerWord = item.word.toLowerCase();
    if (
      wordSet.has(lowerWord) &&
      !seen.has(lowerWord) &&
      lowerWord !== wordKey // 排除自己
    ) {
      filtered.push(item);
      seen.add(lowerWord);
    }
  }

  // 按相似度降序排列
  return filtered.sort((a, b) => b.similarity - a.similarity);
}
