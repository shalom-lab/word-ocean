// 向量维度定义
export const VECTOR_DIMENSIONS = [
  { id: 'business', keywords: '钱币金润益商贸售购佣税企费价富输赢利金融财政经济利润收益交易市场' },
  { id: 'academic', keywords: '学理校教研究公式逻辑智慧考试读写文科科学知识理论分析思考学习' },
  { id: 'emotion', keywords: '情感爱恨喜怒心态脾虑惊吓恐惧乐悲愿嫌情绪心情性情感受感情' },
  { id: 'action', keywords: '打跑拿取走运做造改变推拉提拔放收建投送执行操作移动行动' },
  { id: 'law', keywords: '法律罪捕庭判权证供狱警察规则制度条例法规正义' },
  { id: 'nature', keywords: '天地山水海河生物植矿岩光电流液自然环境地球天气气候' },
  { id: 'abstract', keywords: '性度形式观点象级素因果况态缺优抽象概念品质特征属性' },
  { id: 'time', keywords: '时间日期时刻过去现在未来历史时代年龄阶段周期' },
  { id: 'space', keywords: '空间位置方向距离地点场所区域地方房间房屋建筑' },
  { id: 'communication', keywords: '说讲话语言交流沟通表达告诉通知信息消息传播' },
];

/**
 * 生成语义向量
 * 基于中文释义中的字符匹配来生成向量
 */
export function generateSemanticVector(definition: string): number[] {
  // 初始化零向量
  let vector = new Array(VECTOR_DIMENSIONS.length).fill(0);
  
  VECTOR_DIMENSIONS.forEach((dim, index) => {
    let score = 0;
    // 简单的 "Bag of Characters" 模型
    for (const char of dim.keywords) {
      if (definition.includes(char)) {
        score += 1;
      }
    }
    vector[index] = score;
  });

  // 向量归一化 (让向量长度为1，方便计算余弦相似度)
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    vector = vector.map(val => val / magnitude);
  }
  
  return vector;
}

/**
 * 计算余弦相似度
 * Cosine Similarity = (A . B) / (||A|| * ||B||)
 * 因为我们已经归一化了，所以分母是 1，只需要计算点积
 */
export function calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0;
  }
  
  let dotProduct = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
  }
  
  return Math.max(0, dotProduct); // 确保返回值非负
}

