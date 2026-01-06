import type { WordData } from '../types';

// 获取 Vite 的 base URL（处理子路径部署）
const BASE_URL = import.meta.env.BASE_URL || '/';

const DICTIONARY_FILES: Record<string, string> = {
  '1-初中-顺序': 'json/1-初中-顺序.json',
  '2-高中-顺序': 'json/2-高中-顺序.json',
  '3-CET4-顺序': 'json/3-CET4-顺序.json',
  '4-CET6-顺序': 'json/4-CET6-顺序.json',
  '5-考研-顺序': 'json/5-考研-顺序.json',
  '6-托福-顺序': 'json/6-托福-顺序.json',
  '7-SAT-顺序': 'json/7-SAT-顺序.json',
};

export async function loadDictionary(name: string): Promise<WordData[]> {
  const fileName = DICTIONARY_FILES[name];
  if (!fileName) {
    throw new Error(`字典文件未找到: ${name}`);
  }
  
  // 构建正确的路径，考虑 base URL
  const filePath = `${BASE_URL}${fileName}`.replace(/\/+/g, '/');
  
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`加载字典失败: ${response.statusText}`);
    }
    const data: WordData[] = await response.json();
    return data;
  } catch (error) {
    console.error(`加载字典 ${name} 时出错:`, error);
    throw error;
  }
}

export function formatWordMeaning(word: WordData): string {
  if (word.translations && word.translations.length > 0) {
    return word.translations.map(t => t.translation).join('/');
  }
  return '未知';
}

