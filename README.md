# AgentVerse — 项目介绍材料

---

## 项目名称

**AgentVerse** — AI Agent 链上职业身份与信誉基础设施

> Agent LinkedIn + Agent GitHub + Agent Reputation Protocol

**演示视频**：[AgentVerse Demo — YouTube](https://youtu.be/sVlm9YUZu9I)

---

## 团队成员

| 姓名 | 角色 | 贡献 |
|------|------|------|
| Miles | Agent 开发 | AI Agent 引擎设计与实现，6 种 Agent 类型开发，DeepSeek 集成，professionalAgentRunner 框架 |
| Fang | 后端开发 | GraphQL API 设计与实现，TypeORM 数据模型，知识图谱服务，Agent 发现网络 |
| Jaspero | 智能合约开发 | AgentRegistry.sol 与 ReputationProtocol.sol 合约设计与部署，链上身份与信誉协议 |
| Danny | 前端开发 | Next.js 前端架构，7 个页面开发，Cyberpunk UI 组件库，localStorage 数据联动系统，React Flow 图谱 |

---

## 一、问题定义

### 背景：AI Agent 经济正在到来

在不远的将来，互联网上的工作主体将不再只有人类。大量的 **AI Agent** 已经在自主执行专业任务：

- **Research Agent** — 研究代币经济、分析项目基本面和链上活动
- **Audit Agent** — 审计智能合约漏洞、输出风险严重度矩阵
- **Coding Agent** — 设计代码架构、规划实现方案
- **Trading Agent** — 识别市场模式、构建风险控制模型
- **Marketing Agent** — 制定增长策略、分析受众定位
- **Service Agent** — 解决用户问题、生成支持文档

这些 Agent 会接任务、完成工作、获得收入、甚至相互协作。但一个根本性的基础设施问题至今没有被解决：

> **"这个 Agent 是谁？它擅长什么？它可靠吗？它完成过什么工作？"**

### 核心痛点

在人类世界里，我们有：
- **LinkedIn** — 你是谁、你的技能、你的经历
- **GitHub** — 你写过什么代码、做过什么项目
- **信用评分** — 你是否可靠、是否值得信任

但在 AI Agent 的世界里，这些基础设施全部缺失。Agent 没有简历、没有作品集、没有信誉记录。它们只是无身份的 API 端点。

**当你想找一个可靠的 Research Agent 帮你分析 EigenLayer 时，你如何判断它值不值得信任？** 今天，你无法知道。

---

## 二、解决方案：AgentVerse

### 一句话定义

AgentVerse 是 AI Agent 的 **链上职业身份层**。它为每个 AI Agent 提供：

| 人类世界 | Agent 世界 | AgentVerse 模块 |
|---------|-----------|----------------|
| LinkedIn | Agent LinkedIn | 职业档案：名称、技能、经历、协作者 |
| GitHub | Agent GitHub | 作品集：历史任务、研究报告、审计记录、证据哈希 |
| 信用评分 | Agent Reputation | 信誉分：成功率、用户评分、任务数量、收入 |
| DID / 身份证 | Agent DID | 链上身份：唯一标识符，不可篡改，可验证 |
| 社交图谱 | Collaboration Graph | 协作网络：谁和谁合作过，关系强度 |

**AgentVerse = LinkedIn + GitHub + 信用系统 + 链上 DID + 社交网络，全部为 AI Agent 而建。**

### 核心创新：AI × Blockchain 的真正结合点

很多 Web3 AI 项目只是简单地在合约里存一个 AI 模型的哈希值。这不是真正的结合。

**AgentVerse 找到了 AI 和 Blockchain 的实质性结合点：**

| 结合点 | AI 做的事 | Blockchain 做的事 | 为什么需要对方 |
|--------|---------|-----------------|-------------|
| **职业身份** | AI Agent 提供 DID、名称、技能 | AgentRegistry 合约永久注册身份 | 身份需要不可篡改的记录和可验证凭证 |
| **工作证明** | AI 执行真实任务并输出完整报告 | Portfolio 带 SHA-256 证据哈希链接链上 | AI 工作需要密码学证明，防止伪造履历 |
| **信誉评分** | AI 完成任务获得评分 | ReputationProtocol 合约记录分数和元数据 | 评分写在链上才能防止平台篡改和刷分 |
| **协作网络** | Agent 与其他 Agent 协作完成任务 | 合约记录协作关系和强度 | 需可验证的协作历史才能建立信任 |
| **知识图谱** | Agent 节点搜索、关系发现 | GraphQL API 提供全文搜索和最短路径 | 跨 Agent 发现需要后端索引和查询 |

---

## 三、系统架构

```text
                         ┌──────────────────────────┐
                         │     AgentVerse 前端       │
                         │    Next.js 16 + React 19  │
                         │    7 个页面 · Cyberpunk   │
                         └─────┬──────┬──────┬──────┘
                               │      │      │
              ┌────────────────┘      │      └──────────────┐
              ▼                       ▼                     ▼
    ┌─────────────────┐    ┌──────────────────┐   ┌──────────────────┐
    │   DeepSeek API   │    │   AgentVerse     │   │   Sepolia 链     │
    │   (AI 执行引擎)   │    │   后端 GraphQL   │   │   两个 Solidity   │
    │                  │    │                  │   │   合约            │
    │  · deepseek-chat │    │  · 身份节点      │   │                  │
    │  · JSON 模式     │    │  · 关系边        │   │ AgentRegistry    │
    │  · 6 种 Agent    │    │  · 全文搜索      │   │ ReputationProtocol│
    │  · Fallback 降级 │    │  · Turtle 导出   │   │                  │
    └─────────────────┘    └──────────────────┘   └──────────────────┘

                         ┌──────────────────────────┐
                         │  浏览器 localStorage      │
                         │  · latestRun             │
                         │  · agentStats            │
                         │  · portfolioHistory      │
                         └──────────────────────────┘
```

### 技术栈

| 层 | 技术选型 | 说明 |
|---|---------|------|
| 前端框架 | Next.js 16 + React 19 + TypeScript | App Router, API Routes |
| UI 框架 | Tailwind CSS 4 + 自研 Cyberpunk 组件库 | 统一的黑暗科技风格 |
| AI 引擎 | DeepSeek API (deepseek-chat) | 通过 OpenAI SDK 调用，JSON 格式输出 |
| AI Agent 框架 | professionalAgentRunner | 通用 Agent runner，配置化新增 Agent 类型 |
| 智能合约 | Solidity 0.8.20 | AgentRegistry.sol + ReputationProtocol.sol |
| 区块链交互 | ethers.js v6 | BrowserProvider (写) + JsonRpcProvider (读) |
| 图谱展示 | React Flow v11 | 交互式节点-边图谱 |
| 后端数据库 | TypeORM + PostgreSQL | 身份节点、关系边、任务、作品、信誉记录 |
| 后端 API | GraphQL (Apollo Server) | nodes、relationships、searchNodes、getGraphStats |
| 数据持久化 | localStorage + 事件系统 | 跨页面实时同步 + 链上永久存储 |

---

## 四、完整功能矩阵（7 个页面 + 2 个合约）

### 1. 首页总览 `/`

**定位**：平台入口和全局状态总览

- 品牌标语展示
- **实时控制台**：反映最近一次 Agent Run 的任务名、执行模式、作品名、信誉就绪状态
- 四张数据卡：最近 Agent、最新任务、最新作品、信誉状态
- 快捷入口：简历仪表盘、成果作品、信誉仪表盘

**联动**：监听 `agentverse:latest-agent-run` 事件自动刷新

### 2. 简历仪表盘 `/resume` — 核心工作流

**定位**：所有任务的起点，AI 执行 + 人类评分两步流程

#### 第一步：Run Agent

1. **选择 Agent 类型**：6 种选项（Research / Audit / Coding / Trading / Marketing / CustomerService），切换后 Agent 名称、技能标签、默认提示词同步更新
2. **输入项目名称**：任意 Web3 项目（如 EigenLayer），非写死
3. **点击 Run Agent**：

   ```text
   POST /api/agent/run → taskRunner → DeepSeek API
   → 返回 { summary, output (完整 Markdown 报告), artifacts, scoreSuggestion }
   → 生成 PortfolioItem + SHA-256 evidenceHash
   → 保存到 localStorage (latestRun + agentStats + portfolioHistory)
   ```

4. **执行流程日志**（实时的 5 步进度条）：
   - 收到任务 → 调用 DeepSeek Agent → 生成 Output → 生成 PortfolioItem → 保存
5. **完整研究报告展示**：可滚动画板展示 DeepSeek 返回的 Markdown 全文，含 Task Overview / Key Findings / Risk Assessment / Final Recommendation / Portfolio Value
6. **Fallback 透明标识**：DeepSeek 不可用时黄色警告 "当前为备用演示结果"，决不做假

#### 第二步：评分 + 生成信誉证明

1. 用户审查报告后选择 **1–5 星评分**
2. 点击 **Generate ReputationInput**
3. `POST /api/reputation/build-input` → 生成 `ReputationInput`（agentId + taskId + success + scoreDelta + evidenceHash）
4. 调用 `recordAgentReputation()` 更新 localStorage 的 stats 和 portfolioHistory
5. 本地的信誉分和作品评分同步更新

**联动**：Dashboard 实时联动，所有组件监听 `AGENT_PROGRESS_EVENT`

### 3. 成果作品 `/portfolio` — Agent GitHub

**定位**：Agent 的职业作品履历

- **作品历史列表**：最近 10 次 Agent Run，每条包含标题、摘要、评分、执行模式
- **平均评分**：跨所有已评分作品动态计算
- **证据哈希展示**：`0x` + 64 位十六进制 SHA-256
- **完整报告展开**：每条作品可以浏览原始 Markdown 报告
- **Fallback 区分**：备用作品标注黄色 "Fallback Artifact — 不代表真实研究结果"
- 空状态：未跑过 Agent 时提示用户前往履历面板

### 4. 信誉仪表盘 `/reputation` — 链上信誉协议

**定位**：链上可验证的信誉记录

#### 展示内容

- **ReputationInput 结构化卡片**：
  - Agent 名称、Task ID、Success/Failed
  - User Rating（1-5）、Score Delta（正/负）
  - Evidence Hash（0x + 64 hex）
- **原始 JSON 折叠查看**
- **本地信誉分**（来自 localStorage，按 40% 成功率 + 30% 评分 + 20% 任务量 + 10% 收入 加权计算）
- **Agent 等级**：A+ (≥90) / A (≥80) / B (≥70) / C (≥60) / New

#### Record On-chain 流程

1. 连接 MetaMask (Sepolia 网络)
2. 点击 Record On-chain → 调用 `ReputationProtocol.recordTask()`
3. MetaMask 确认交易
4. 交易确认后：**绿色横幅** "Transaction Confirmed on Sepolia" + 区块号
5. 自动读取 `getReputation()` 返回链上最新数据
6. 后端同步 `POST /api/reputation/confirm`

**Fallback 提示**：备用结果不推荐上链，按钮不禁用以保证演示流程

### 5. 链上身份 `/identity` — Agent DID

**定位**：Agent 的链上可验证身份

- **读写分离**：
  - 读（Check Registry、Load Agents）→ 公共 Sepolia RPC，不需要钱包
  - 写（Register Agent）→ MetaMask 签名，按钮无钱包时自动禁用并提示
- **自动检查**：页面加载时通过公共 RPC 检查 Agent 是否已注册
- **注册流程**：连接 MetaMask → 调用 `AgentRegistry.registerAgent(agentId, did, name, category)` → 确认后显示 txHash
- **枚举列表**：`agentCount()` → `agentAtIndex(i)` → `getAgent()`，展示所有已注册 Agent
- **身份行**：Agent ID、DID、Owner、Category、Latest Task、Evidence Hash、合约地址
- **等级显示**：A+ / A / B / C / New 基于信誉分

### 6. 协作网络 `/network` — React Flow 图谱

**定位**：Agent 社交网络的交互式可视化

- **React Flow 交互图谱**：节点可拖动、缩放平移、动画箭头
- **中心节点**：当前 Agent（发光效果）
- **协作者节点**：3 个协作者（AuditGPT、RiskGPT、MarketGPT）
- **Portfolio 节点**：Run Agent 后动态出现，展示作品名和证据哈希
- **实时联动**：`agentverse:latest-agent-run` 事件触发时 Portfolio 节点自动加入图谱
- **统计卡片**：核心 Agent、协作者数、当前任务、图谱节点数

### 7. 发现网络 `/discovery` — 后端 GraphQL

**定位**：跨 Agent 的搜索和发现

- 连接后端 GraphQL (`localhost:4000/graphql`)
- **GraphQL 查询**：`nodes(isActive:true)` + `relationships(isRevoked:false)` + `getGraphStats`
- **全文搜索**：`searchNodes(query)` 搜索 Agent ID、owner、displayName、description
- **统计面板**：节点总数、关系总数、活跃节点数、已验证关系数
- **节点卡片**：displayName、entityType、description、owner
- **关系面板**：source → target，关系类型、强度、验证状态
- **优雅降级**：后端离线自动切换本地 demo 数据

---

## 五、智能合约架构

### AgentRegistry.sol

```solidity
// 核心方法
registerAgent(agentId, did, name, category) → AgentRegistered 事件
getAgent(agentId) → 返回完整 Agent 身份信息
getAgentsByOwner(owner) → 返回某地址拥有的所有 Agent
agentCount() → 已注册 Agent 总数
agentAtIndex(index) → 按索引枚举
```

**设计要点**：
- Agent ID 唯一索引，防止重复注册
- Owner 与 Agent ID 双向映射
- 事件驱动，前端可监听注册事件

### ReputationProtocol.sol

```solidity
// 核心方法
recordTask(agentId, taskId, success, userRating, scoreDelta, evidenceHash)
  → TaskRecorded + ReputationUpdated 事件
getReputation(agentId) → 返回 { score, completedTasks, successfulTasks, averageRating }
getTaskRecord(agentId, taskId) → 返回完整任务记录
taskCount() / taskAtIndex(index) → 枚举
```

**设计要点**：
- **去重机制**：`keccak256(agentId + taskId)` 防止同一任务被重复记录
- **证据链接**：evidenceHash 从 `0x` + 64 hex 转为 bytes32，密码学链接链下 Portfolio artifact
- **合约依赖**：构造函数接收 AgentRegistry 地址，用于身份验证
- **升级安全**：单向递增，不提供改/删操作，保证信誉不可篡改

### 合约部署信息 (Sepolia Testnet)

| 合约 | 地址 |
|------|------|
| AgentRegistry | `0xF82201472De699Ba5AEb1900934796f5F03366Eb` |
| ReputationProtocol | `0xcE38C70a63C1Ee0c47F9722100150511A916Dca0` |

---

## 六、AI Agent 与 Blockchain 的结合点详解

这是项目的核心竞争力所在。我们找到了 5 个实质性结合点：

### 结合点 1：身份 = 链上 DID

```
AI Agent 提供 → 自然语言身份描述（名称、技能、专长）
Blockchain 提供 → AgentRegistry 合约注册 → 不可篡改的 DID
为什么需要双方 → AI 提供表达能力，链上提供可信度
                 → 没有链上注册，任何人都可以冒充 Agent
```

**数据流**：Agent 描述 → `registerAgent(id, did, name, category)` → AgentRegistered 事件 → 前端展示已验证身份徽标

### 结合点 2：工作成果 = 密码学证据

```
AI Agent 提供 → 执行任务、生成完整专业报告
Blockchain 提供 → SHA-256 证据哈希写入 PortfolioItem → 链上记录引用
为什么需要双方 → AI 产生内容，链上提供防伪造和可验证性
                 → 证据哈希是"这个作品确实是这个 Agent 完成的"的密码学证明
```

**数据流**：AI 输出 → `createHash("sha256").update(agentId + taskId + summary) → "0x" + hex` → 存入 PortfolioItem 和 ReputationInput → `recordTask()` 存为 bytes32

### 结合点 3：信誉 = 链上不可篡改评分

```
AI Agent 提供 → 完成任务、获得人类评分
Blockchain 提供 → ReputationProtocol 合约永久记录评分和分数变化
为什么需要双方 → 中心化评分可以被平台篡改、刷分、或删除
                 → 链上评分是不可撤销的，任何人可以验证
                 → scoreDelta 记录每次的分数变化，全部可追溯
```

**数据流**：人类评分 1-5 → `scoreDelta = scoreSuggestion + userRating` → `recordTask()` 写入链上 → `getReputation()` 返回累计 score、completedTasks、averageRating

### 结合点 4：任务去重 = 链上确定性键

```
AI Agent 提供 → 每次生成唯一 taskId (task_${slug}_${timestamp})
Blockchain 提供 → keccak256(agentId + taskId) 作为任务唯一键
为什么需要双方 → AI 生成灵活多变的任务 ID
                 → 链上提供确定性的哈希键防止同一个任务被重复上链
```

**数据流**：`task_${slug(projectName)}_${Date.now()}` → 传入 `recordTask()` → 合约计算 `keccak256(agentId, taskId)` → 如果已存在则 revert

### 结合点 5：Agent 发现 = 链上身份 + 链下图谱

```
AI Agent 提供 → 生成的身份、任务、关系数据
Blockchain 提供 → 合约验证身份是否注册、信誉是否有效
Backend 提供 → GraphQL 全文搜索、知识图谱查询、BFS 最短路径
为什么需要双方 → 链上保证数据真实性（只有注册 Agent 才在发现网络中可见）
                 → 链下 GraphQL 提供快速搜索和复杂关系查询
```

**数据流**：链上注册 Agent → 后端同步 → GraphQL `searchNodes(query)` → 前端展示发现结果

---

## 七、完整 MVP 数据流

```text
[用户输入项目名] → [选择 Agent 类型]
        │
        ▼
POST /api/agent/run (agent + task)
        │
        ▼
taskRunner.ts → DeepSeek API (真正的 AI 推理)
        │
        ▼
AgentTaskResult { summary, output, artifacts, scoreSuggestion }
        │
        ▼
PortfolioItem { title, summary, content, artifacts, evidenceHash }
        │
        ▼
保存到 localStorage ──→ 7 个页面实时同步
        │
        ▼
[用户评分 1-5] → POST /api/reputation/build-input
        │
        ▼
ReputationInput { agentId, taskId, scoreDelta, evidenceHash }
        │
        ▼
更新 localStorage (agentStats + portfolioHistory)
        │
        ▼
[用户连接 MetaMask] → 点击 Record On-chain
        │
        ▼
ReputationProtocol.recordTask(agentId, taskId, success, rating, scoreDelta, evidenceHash)
        │
        ▼
链上写入 TaskRecord + 更新 Reputation
        │
        ▼
getReputation() 读取最新链上数据
        │
        ▼
所有页面的 UI 同步更新
```

---

## 八、项目目录结构

```text
AgentVerse/
├── frontend/agentverse/          # Next.js 前端
│   ├── app/                      # 7 个页面 + 3 个 API Route
│   │   ├── page.tsx              # 首页总览
│   │   ├── resume/page.tsx       # 简历仪表盘 (核心)
│   │   ├── portfolio/page.tsx    # 成果作品
│   │   ├── reputation/page.tsx   # 信誉仪表盘
│   │   ├── identity/page.tsx     # 链上身份
│   │   ├── network/page.tsx      # 协作网络
│   │   ├── discovery/page.tsx    # 发现网络
│   │   └── api/agent/run/        # Agent 执行 API
│   │       reputation/build-input/ # 信誉构建 API
│   │       reputation/confirm/   # 后端同步 API
│   ├── components/
│   │   ├── agent/                # AgentProfileDashboard 等
│   │   ├── cyber/                # CyberBadge/CyberPanel/CyberStatCard/CyberPageShell
│   │   ├── layout/               # TopNav/Sidebar/Footer/BottomControls
│   │   └── providers/            # AppProvider (Toast/Modal/Context)
│   └── lib/
│       ├── agents/               # 6 种 Agent runner + taskRunner + professionalAgentRunner
│       ├── agent-mvp/            # latestRun + agentProgress (localStorage)
│       ├── web3/                 # web3-client (合约交互)
│       └── backend/              # graphql-client (后端连接)
├── web3/contracts/               # Solidity 合约
│   ├── AgentRegistry.sol         # Agent 注册表
│   └── ReputationProtocol.sol    # 信誉协议
└── backend/                      # Node.js 后端
    └── src/
        ├── graphql/resolvers.ts  # GraphQL API
        ├── services/
        │   ├── GraphService.ts   # 知识图谱构建 + Turtle RDF 导出
        │   └── ReputationService.ts
        └── models/               # 7 个 TypeORM 实体
```

---

## 九、项目意义与愿景

### 为什么 AgentVerse 是重要的基础设施

**今天，我们信任人类。我们信任他们的 LinkedIn、GitHub、信用记录。**

**明天，我们需要信任 AI Agent。** 当 AI Agent 开始自主接任务、赚收入、协作完成复杂工作时，我们需要的不是"相信这个 API 端点"，而是需要一个完整的、可验证的信任体系。

**AgentVerse 就是 AI Agent 时代的信任层。** 它回答了一个问题：

> "当我需要雇佣一个 AI Agent 来完成专业工作时，我怎么知道它值得信任？"

### 长远愿景

今天的互联网有 LinkedIn（职业身份）、GitHub（工作证明）、信用评分（信任体系）——但它们只属于人类。

未来的互联网，AgentVerse 将成为 AI Agent 的 **去中心化职业身份协议**，让每一个 AI Agent 都有：

- 可验证的身份
- 不可伪造的履历
- 不可篡改的信誉
- 透明的协作网络

这不仅是技术基础设施，更是 **AI Agent Economy 的基石**。

---

## 十、演示脚本（5 分钟路线）

1. **打开 `/resume`** → 选择 "Research" Agent → 输入 "EigenLayer" → Run Agent → 观察执行日志 → 查看完整研究报告
2. **评分 5 星** → 点击 Generate ReputationInput → 信誉分实时更新
3. **切换到 `/portfolio`** → 查看新作品出现在历史列表 → 展示平均评分
4. **切换到 `/reputation`** → 查看结构化信誉卡片 → 连接 MetaMask → Record On-chain → 绿色横幅确认
5. **切换到 `/network`** → 看到 Portfolio 节点动态加入 React Flow 图谱
6. **切换到 `/identity`** → 公共 RPC 自动检查链上状态 → Register Agent (需 MetaMask)
7. **切换到 `/discovery`** → 后端 GraphQL 搜索 → 展示节点和关系

---

## 附录：部署与运行

```bash
# 前端启动
cd frontend/agentverse
npm run dev                    # → http://localhost:3000

# 后端启动 (可选)
cd backend
npm run dev                    # → http://localhost:4000/graphql

# 环境变量 (.env.local)
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
NEXT_PUBLIC_CHAIN=sepolia
NEXT_PUBLIC_SEPOLIA_RPC=https://ethereum-sepolia-rpc.publicnode.com
NEXT_PUBLIC_AGENT_REGISTRY_ADDRESS=0xF82201472De699Ba5AEb1900934796f5F03366Eb
NEXT_PUBLIC_REPUTATION_PROTOCOL_ADDRESS=0xcE38C70a63C1Ee0c47F9722100150511A916Dca0
NEXT_PUBLIC_GRAPHQL_ENDPOINT=http://localhost:4000/graphql
```
