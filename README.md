# 美食盲盒

一个帮助用户随机选择附近美食的移动端应用。

## 项目介绍

美食盲盒是一款基于地理位置的餐厅推荐应用，帮助用户解决"吃什么"这个永恒的难题。通过随机推荐附近的餐厅，让用户摆脱选择困难，发现更多美食选择。

## 主要功能

- 🎯 **一键随机**：随机推荐附近餐厅，告别选择困难
- 📍 **位置感知**：基于用户当前位置，推荐周边美食
- ❤️ **收藏功能**：收藏喜欢的餐厅，方便再次查看
- 🔍 **详细信息**：展示餐厅评分、人均价格、营业时间等信息
- 📱 **移动优先**：专为移动设备优化的界面设计

## 技术栈

- ⚛️ React 18
- 📘 TypeScript
- 🎨 SCSS Modules
- 📱 Ant Design Mobile
- 🗺️ 高德地图 API
- 🔄 Redux Toolkit
- 🛣️ React Router

## 开发环境

- Node.js >= 18.0.0
- npm >= 9.0.0

## 快速开始

1. 克隆项目
```bash
git clone https://github.com/zbw-zbw/food-lucky-box.git
cd food-lucky-box
```

2. 安装依赖
```bash
cd frontend
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 构建生产版本
```bash
npm run build
```

## 项目结构

```
frontend/
├── src/
│   ├── components/     # 公共组件
│   ├── pages/         # 页面组件
│   ├── store/         # Redux store
│   ├── utils/         # 工具函数
│   ├── hooks/         # 自定义 hooks
│   └── types/         # TypeScript 类型定义
├── public/            # 静态资源
└── package.json       # 项目配置
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 许可证

MIT License 
