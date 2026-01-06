// 扩展的词根字典
export const ROOT_DICTIONARY: Record<string, { meaning: string; color: string }> = {
  // 基础词根
  'tract': { meaning: '拉/引', color: '#f59e0b' },
  'spect': { meaning: '看', color: '#3b82f6' },
  'port': { meaning: '拿/运', color: '#ef4444' },
  'form': { meaning: '形状', color: '#10b981' },
  'miss': { meaning: '送/投', color: '#8b5cf6' },
  'mit': { meaning: '送/投', color: '#8b5cf6' },
  'fer': { meaning: '拿/带', color: '#ec4899' },
  'fact': { meaning: '做', color: '#06b6d4' },
  'fect': { meaning: '做', color: '#06b6d4' },
  'flu': { meaning: '流', color: '#6366f1' },
  'logy': { meaning: '学科', color: '#84cc16' },
  'graph': { meaning: '写/画', color: '#f97316' },
  'gram': { meaning: '写/文字', color: '#f97316' },
  'scribe': { meaning: '写', color: '#f97316' },
  'script': { meaning: '写', color: '#f97316' },
  'struct': { meaning: '建造', color: '#14b8a6' },
  'dict': { meaning: '说', color: '#a855f7' },
  'duct': { meaning: '引导', color: '#06b6d4' },
  'duce': { meaning: '引导', color: '#06b6d4' },
  'vert': { meaning: '转', color: '#ec4899' },
  'vers': { meaning: '转', color: '#ec4899' },
  'ceed': { meaning: '走', color: '#10b981' },
  'cess': { meaning: '走', color: '#10b981' },
  'ced': { meaning: '走', color: '#10b981' },
  'cept': { meaning: '拿/取', color: '#3b82f6' },
  'cap': { meaning: '拿/取', color: '#3b82f6' },
  'ceive': { meaning: '拿/取', color: '#3b82f6' },
  'press': { meaning: '压', color: '#ef4444' },
  'pose': { meaning: '放置', color: '#f59e0b' },
  'pos': { meaning: '放置', color: '#f59e0b' },
  'sist': { meaning: '站立', color: '#8b5cf6' },
  'stand': { meaning: '站立', color: '#8b5cf6' },
  'sta': { meaning: '站立', color: '#8b5cf6' },
  'vis': { meaning: '看', color: '#3b82f6' },
  'vid': { meaning: '看', color: '#3b82f6' },
  'voc': { meaning: '声音/叫', color: '#a855f7' },
  'vok': { meaning: '声音/叫', color: '#a855f7' },
  'pend': { meaning: '悬挂', color: '#ec4899' },
  'pens': { meaning: '悬挂', color: '#ec4899' },
  'sent': { meaning: '感觉', color: '#6366f1' },
  'sens': { meaning: '感觉', color: '#6366f1' },
  'tain': { meaning: '保持', color: '#06b6d4' },
  'ten': { meaning: '保持', color: '#06b6d4' },
  'tend': { meaning: '伸展', color: '#10b981' },
  'tens': { meaning: '伸展', color: '#10b981' },
  'tent': { meaning: '伸展', color: '#10b981' },
  'act': { meaning: '做/行动', color: '#f59e0b' },
  'ag': { meaning: '做/行动', color: '#f59e0b' },
  'lect': { meaning: '选择/收集', color: '#3b82f6' },
  'leg': { meaning: '选择/收集', color: '#3b82f6' },
  'lig': { meaning: '选择/收集', color: '#3b82f6' },
  'mov': { meaning: '移动', color: '#ec4899' },
  'mob': { meaning: '移动', color: '#ec4899' },
  'mot': { meaning: '移动', color: '#ec4899' },
  'spec': { meaning: '看', color: '#3b82f6' },
  'spic': { meaning: '看', color: '#3b82f6' },
};

export function detectRoot(word: string): string | null {
  const roots = Object.keys(ROOT_DICTIONARY).sort((a, b) => b.length - a.length);
  
  for (const root of roots) {
    if (word.toLowerCase().includes(root.toLowerCase())) {
      // 如果单词就是词根本身且长度大于3，返回
      if (word.toLowerCase() === root.toLowerCase() && word.length > 3) {
        return root;
      }
      // 如果单词包含词根但不是词根本身，返回
      if (word.toLowerCase() !== root.toLowerCase()) {
        return root;
      }
    }
  }
  
  return null;
}

