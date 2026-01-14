<div align="center">

![Word Ocean Logo](public/logo.svg)

# 🌊 词海 (Word Ocean)

**基于语义相似度的智能单词学习工具**

[![GitHub](https://img.shields.io/github/license/shalom-lab/word-ocean)](LICENSE)
[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://shalom-lab.github.io/word-ocean/)

通过 AI 语义分析和多种关联算法，帮助学习者更高效地记忆和联想单词。

[在线体验](https://shalom-lab.github.io/word-ocean/) • [功能特性](#功能特性) • [技术栈](#技术栈)

</div>

---

## ✨ 功能特性

### 🔗 三种智能关联

- **🔵 词根关联**：自动识别词根，将同源单词连接
- **🟡 语义相似**：基于阿里通义千问 (Qwen) 向量模型计算语义相似度，发现意义相近的单词
- **🟢 拼写相似**：通过编辑距离算法发现拼写相似的单词

### 📚 丰富的词库

支持 7 个不同级别的单词表：
- 初中词汇
- 高中词汇
- CET-4 词汇
- CET-6 词汇
- 考研词汇
- 托福词汇
- SAT 词汇

### 🔊 智能语音朗读

- 🎵 **自动播放**：选择单词时自动播放美音发音
- 🇬🇧 **英音美音**：支持英式英语和美式英语两种发音
- 📝 **短语朗读**：支持常用短语的语音播放
- 🎯 **一键切换**：点击小喇叭图标即可切换不同发音

### 🚀 现代化体验

- ⚡ **PWA 支持**：可安装到桌面，离线使用
- 💾 **智能缓存**：Service Worker 自动缓存，加载速度快
- 📱 **响应式设计**：完美支持桌面和移动设备
- 🎨 **优雅界面**：现代化的 UI 设计，操作流畅

## 🤖 语义分析技术

本项目的语义相似度计算使用了**阿里云通义千问 (Qwen) 向量模型**：

### 模型信息
- **模型名称**：通义千问 (Qwen) `text-embedding-v4`
- **向量维度**：1024 维
- **数据规模**：基于约 15,000 个单词的向量化数据
- **相似度算法**：余弦相似度 (Cosine Similarity)

### 预计算优化
- 每个单词预计算了 **TOP 50** 个最相似的单词
- 相似度结果存储在 `word_top_similar.json` 中（约 48MB）
- 前端直接查询预计算结果，响应速度快，无需实时调用 API

### 关于限量使用
本项目使用了阿里云通义千问的**免费额度**进行向量化：
- 免费额度：1,000,000 tokens
- 实际使用：约 1,400,000 tokens（14,135 个单词）
- 成本：约 0.7 元人民币

所有向量化工作已完成，应用运行时不消耗任何 API 配额，完全依赖预计算的数据。

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：Tailwind CSS
- **AI 模型**：阿里通义千问 (Qwen) 向量模型
- **离线支持**：Service Worker + IndexedDB
- **部署**：GitHub Pages + GitHub Actions

## 📦 快速开始

### 前置要求

- Node.js >= 18
- npm 或 yarn

### 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/shalom-lab/word-ocean.git
cd word-ocean

# 2. 安装依赖
npm install

# 3. 复制 JSON 单词表到 public 目录
# Windows
xcopy json public\json\ /E /I /Y

# Linux/Mac
cp -r json/* public/json/

# 4. 启动开发服务器
npm run dev
```

访问 http://localhost:3000/word-ocean/ 查看应用。

## 🎯 使用说明

1. **选择单词表**：在顶部下拉菜单中选择要学习的单词表级别
2. **浏览单词**：在左侧列表浏览单词，支持搜索功能
3. **查看关联**：点击任意单词，查看该单词的三种关联类型
4. **切换类型**：使用顶部工具栏切换显示不同类型的关联单词
5. **随机探索**：点击"随机"按钮，发现新单词
6. **语音学习**：选择单词后自动播放美音，点击右上角小喇叭图标可切换英音/美音，短语也支持语音播放

### 关联类型说明

- **🔵 词根关联**：显示所有相同词根的单词（无数量限制）
- **🟡 语义相似**：显示语义最相似的前 10 个单词（基于 Qwen 向量模型）
- **🟢 拼写相似**：显示拼写相似的前 8 个单词（编辑距离 ≤ 2）

## 🚀 部署

项目使用 GitHub Actions 自动部署到 GitHub Pages。

### 本地构建

```bash
npm run build
npm run dev
```

### 生产环境

访问地址：https://shalom-lab.github.io/word-ocean/


## 🙏 致谢

- **单词数据**：来自 [KyleBing/english-vocabulary](https://github.com/KyleBing/english-vocabulary) 仓库
- **AI 模型**：阿里云通义千问 (Qwen) 向量模型

## 📄 许可证

MIT License

---

<div align="center">

Made with ❤️ by [shalom-lab](https://github.com/shalom-lab)

[⭐ Star this repo](https://github.com/shalom-lab/word-ocean) if you find it helpful!

</div>
