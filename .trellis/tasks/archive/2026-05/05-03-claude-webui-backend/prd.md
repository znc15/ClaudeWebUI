# ClaudeCode WebUI Backend

## Goal

为现有的 Claude Code WebUI 前端实现后端服务，支持在手机上远程执行 Claude Code 命令。采用 PTY 代理模式，通过 WebSocket 实现浏览器与 Claude CLI 之间的实时双向通信。

## What I already know

### 前端现状
- **框架**: React 18 + Vite + Tailwind CSS 4
- **UI 组件**: shadcn/ui (Radix UI 基础)
- **已有组件**:
  - `ChatView` - 聊天视图，支持消息展示、思考块、工具调用展示
  - `LeftSidebar` - 左侧边栏，会话列表
  - `RightSidebar` - 右侧边栏
  - `SettingsDialog` - 设置对话框
- **消息类型**: 支持 thinking、bash、grep、edit、text 五种工具块
- **样式**: 支持深色/浅色主题切换

### 研究发现
- **推荐架构**: PTY 代理模式 (Browser → WebSocket → node-pty → Claude CLI)
- **核心依赖**: `node-pty` + `ws` (或 Socket.IO)
- **终端模拟**: xterm.js (前端已有类似 UI，需集成)
- **参考项目**: sugyan/claude-code-webui (最成熟，1016 Stars)

### 技术栈共识
| 层级 | 选择 |
|------|------|
| 后端运行时 | Node.js (需要 node-pty) |
| PTY 进程管理 | node-pty |
| 实时通信 | WebSocket (ws 或 Socket.IO) |
| 会话持久化 | tmux (可选) / JSONL 文件 |
| 远程访问 | Tailscale VPN / Cloudflare Tunnel |

## Assumptions (temporary)

1. 用户在本地运行后端服务，前端通过局域网或 VPN 访问
2. 单用户场景，暂不需要多用户隔离
3. Windows 环境优先 (用户使用 Windows 10)
4. 需要支持移动端浏览器访问

## Open Questions

~~所有问题已确认~~

## Decisions (ADR-lite)

### D1: 终端 UI 方案
**决策**: 聊天式 UI（保持现有前端风格）
**理由**: 用户选择方案 1，前端已有完善的聊天视图组件
**后果**: 后端需要解析 ANSI 输出，转换为结构化消息块

### D2: 会话持久化方案
**决策**: JSONL 文件持久化
**理由**: 用户选择方案 2，Claude Code 原生格式兼容性好
**后果**: 需要实现 JSONL 解析和写入逻辑

### D3: 认证方案
**决策**: 支持无认证 + 自定义密码两种模式
**理由**: 用户要求灵活性
**后果**: 需要配置项和密码验证中间件

## Requirements (evolving)

### 核心功能
- [ ] WebSocket 服务器，支持前端连接
- [ ] PTY 进程管理，启动 Claude CLI
- [ ] 输入输出双向转发
- [ ] ANSI 输出解析，转换为结构化消息块
- [ ] JSONL 会话持久化（读取和写入）
- [ ] 会话列表展示
- [ ] 多会话支持

### 认证功能
- [ ] 无认证模式（默认）
- [ ] 密码保护模式（可配置）
- [ ] 配置文件支持

### 移动端优化
- [ ] 响应式布局适配
- [ ] 触摸友好的交互

## Acceptance Criteria (evolving)

- [ ] 可以从手机浏览器访问 WebUI
- [ ] 可以发送消息并收到 Claude 的回复
- [ ] 可以看到 Claude 的工具调用（Bash、Grep、Edit 等）
- [ ] 可以创建和管理多个会话

## Definition of Done

- 后端服务可启动并监听端口
- 前后端 WebSocket 连接正常
- 可以执行 Claude Code 命令并看到输出
- 代码通过 lint 和类型检查
- README 包含启动说明

## Out of Scope (explicit)

- 多用户隔离
- 云端部署（仅本地运行）
- 付费功能（如推送通知服务）
- 官方 Remote Control 功能的替代

## Technical Notes

### 现有前端文件
- `src/app/App.tsx` - 主应用组件
- `src/app/components/chat-view.tsx` - 聊天视图
- `package.json` - 依赖配置

### 参考项目
- sugyan/claude-code-webui: https://github.com/sugyan/claude-code-webui
- 研究文件: `.trellis/tasks/00-bootstrap-guidelines/research/claude-webui-projects.md`

### 关键技术点
1. node-pty 在 Windows 上使用 ConPTY
2. WebSocket 需要处理断线重连
3. ANSI 转义序列需要正确处理
