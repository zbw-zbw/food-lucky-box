# 美食盲盒 H5

一个帮助用户随机选择附近美食的移动端应用。

## 功能特点

- 基于位置的餐厅推荐
- 一键随机选择
- 收藏喜欢的餐厅
- 分享功能

## 技术栈

- React 18
- TypeScript
- SCSS
- Ant Design Mobile
- React Router
- Redux Toolkit
- 高德地图 API

## 开发环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

## 安装和运行

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm run dev
```

3. 构建生产版本：
```bash
npm run build
```

## 项目结构

```
src/
├── api/            # API 接口
├── assets/         # 静态资源
├── components/     # 公共组件
├── hooks/          # 自定义 hooks
├── pages/          # 页面组件
├── store/          # Redux store
├── styles/         # 全局样式
├── types/          # TypeScript 类型定义
└── utils/          # 工具函数
```

## 开发规范

- 使用 TypeScript 进行开发
- 使用 SCSS 模块化样式
- 遵循 React Hooks 最佳实践
- 使用 ESLint 和 Prettier 进行代码格式化

## 贡献指南

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的改动 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request
