# 美食盲盒前端项目

## 技术栈

- React 18
- TypeScript 5.x
- Vite 5.x
- SCSS Modules
- Ant Design Mobile 5.x
- Redux Toolkit
- React Router 6.x
- 高德地图 JavaScript API 2.0

## 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 高德地图 API Key（需要自行申请）

## 本地开发

1. 安装依赖
```bash
npm install
```

2. 配置环境变量
```bash
# 创建 .env.local 文件并添加以下内容
VITE_AMAP_KEY=your_amap_key_here
VITE_AMAP_SECURITY_CODE=your_security_code_here
```

3. 启动开发服务器
```bash
npm run dev
```

4. 打开浏览器访问 http://localhost:5173

## 构建部署

```bash
# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 项目结构

```
src/
├── components/        # 公共组件
│   ├── FavoriteButton/   # 收藏按钮组件
│   ├── Rating/          # 评分组件
│   ├── Tags/           # 标签组件
│   └── Toast/          # 提示组件
├── pages/            # 页面组件
│   ├── Home/           # 首页
│   ├── Result/         # 结果页
│   └── Favorite/       # 收藏页
├── store/            # Redux store
├── utils/            # 工具函数
│   └── map.ts         # 地图相关工具
├── hooks/            # 自定义 hooks
├── types/            # TypeScript 类型定义
└── App.tsx          # 根组件

## 开发规范

- 使用 TypeScript 进行开发
- 使用 SCSS Modules 进行样式隔离
- 遵循 React Hooks 最佳实践
- 使用 ESLint 和 Prettier 进行代码格式化

## 注意事项

- 确保高德地图 API Key 已正确配置
- 开发时注意跨域和安全域名设置
- 移动端适配请使用 rem 或 vw 单位
- 注意处理定位权限和网络异常情况
