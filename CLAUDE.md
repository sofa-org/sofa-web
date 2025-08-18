# SOFA Web 项目概览

## 项目简介

SOFA Web 是一个基于 React 的去中心化金融（DeFi）应用前端项目，提供结构化金融产品交易平台。项目采用 monorepo 架构，使用 Nx 作为构建系统管理多个包。

## 技术栈

### 核心框架

- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **React Router v6** - 路由管理
- **Zustand** - 状态管理

### UI 组件库

- **@douyinfe/semi-ui** - UI 组件库
- **Sass/SCSS** - 样式预处理器
- **CSS Modules** - 样式模块化

### Web3 相关

- **ethers v6** - 以太坊交互库
- **智能合约 ABIs** - 包括 DualVault、DNTVault、SmartTrendVault、Automator 等合约接口

### 工具库

- **i18next** - 国际化
- **Sentry** - 错误监控
- **axios** - HTTP 客户端
- **dayjs** - 日期处理
- **big.js** - 高精度数值计算
- **echarts** - 图表库
- **gsap** - 动画库

### 开发工具

- **pnpm** - 包管理器
- **Nx** - Monorepo 构建系统
- **ESLint + Prettier** - 代码规范
- **Husky + lint-staged** - Git hooks
- **Vitest** - 单元测试

## 项目结构

```
sofa-web/
├── apps/
│   └── dapp/                    # 主应用
│       ├── src/
│       │   ├── assets/          # 静态资源
│       │   ├── components/      # 通用组件
│       │   ├── pages/           # 页面组件
│       │   ├── locales/         # 国际化文件
│       │   ├── styles/          # 全局样式
│       │   ├── main.tsx         # 应用入口
│       │   ├── routes.tsx       # 路由配置
│       │   └── store.ts         # 全局状态
│       └── public/              # 公共资源
├── libs/
│   ├── alg/                     # WebAssembly 算法库（Rust）
│   │   └── pkg/                 # WASM 编译产物
│   ├── effects/                 # 视觉效果组件
│   ├── services/                # 业务服务层
│   │   ├── abis/               # 智能合约 ABI
│   │   ├── auth.ts             # 认证服务
│   │   ├── products.ts         # 产品服务
│   │   ├── automator.ts        # Automator 服务
│   │   ├── positions.ts        # 持仓服务
│   │   ├── wallet.ts           # 钱包服务
│   │   ├── contracts.ts        # 合约交互
│   │   └── vaults/             # Vault 配置
│   └── utils/                   # 工具函数库
│       ├── amount.ts           # 金额处理
│       ├── decorators.ts       # 装饰器
│       ├── hooks.ts            # 通用 Hooks
│       └── http.ts             # HTTP 工具
└── package.json                 # 根配置文件
```

## 核心功能模块

### 1. 产品交易（Products）

- **产品类型**：DNT、BullSpread、BearSpread、Dual
- **风险类型**：Protected、Risky、Leverage、Dual
- **核心服务**：ProductsService 处理报价、交易、概率计算等

### 2. Automator（自动化策略）

- 创建和管理自动化投资策略
- 支持存款、取款、历史记录查看
- 策略分享和社交功能

### 3. 持仓管理（Positions）

- 查看当前持仓
- 历史订单记录
- 收益统计和分析

### 4. 钱包连接

- 支持多种钱包连接（MetaMask、WalletConnect 等）
- 多链支持（Ethereum、Arbitrum、BSC、Polygon 等）

### 5. RCH 代币系统

- RCH 代币质押
- 积分系统
- 空投和奖励

## 主要页面路由

- `/` - 首页
- `/products` - 产品交易
- `/products/customize` - 自定义产品
- `/products/automator` - Automator 策略
- `/products/automator/create` - 创建策略
- `/positions` - 持仓管理
- `/positions/orders` - 历史订单
- `/rch` - RCH 代币
- `/points` - 积分系统
- `/mechanism` - 机制说明
- `/strengths` - 优势介绍

## 环境配置

项目支持多环境配置：

- `daily` - 日常开发环境
- `demo` - 演示环境
- `pre` - 预发布环境
- `prod` - 生产环境

主要环境变量：

- `VITE_ENV` - 环境标识
- `VITE_BACKEND` - 后端 API 地址
- `VITE_RPC_URL_OF_*` - 各链的 RPC 节点
- `VITE_SITE_KEY` - 站点密钥

## 开发命令

```bash
# 安装依赖
pnpm i

# 开发服务器
pnpm nx run dapp:dev

# 构建
pnpm nx run dapp:build

# 代码检查
pnpm lint

# 测试
pnpm test
```

## 国际化支持

支持多语言：

- en-US（英语）
- zh-CN（简体中文）
- zh-HK（繁体中文-香港）
- zh-TW（繁体中文-台湾）
- ja-JP（日语）
- ru-RU（俄语）

## 特色功能

1. **WebAssembly 优化**：使用 Rust 编写的算法库，编译为 WASM 提升计算性能
2. **视觉效果**：丰富的动画效果和 3D 模型展示
3. **响应式设计**：支持 PC 和移动端
4. **实时数据**：WebSocket 支持实时价格和订单更新
5. **模块化架构**：清晰的分层设计，便于维护和扩展

## 安全特性

- Sentry 错误监控
- 合约地址和 ABI 严格管理
- 钱包连接安全验证
- 交易签名和验证机制
