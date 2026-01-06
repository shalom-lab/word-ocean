/**
 * 计算编辑距离 (Levenshtein Distance)
 * 用于检测拼写相似的单词
 */
export function getEditDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 99;
  
  const matrix: number[][] = [];
  
  // 初始化第一行和第一列
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // 替换
          Math.min(
            matrix[i][j - 1] + 1,   // 插入
            matrix[i - 1][j] + 1    // 删除
          )
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

