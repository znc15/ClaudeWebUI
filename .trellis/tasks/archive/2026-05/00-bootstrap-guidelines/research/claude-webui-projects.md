# Research: Claude Code WebUI 相关开源项目

- **Query**: Claude Code Web UI / Claude CLI Web 界面 / 远程执行 / 移动端界面
- **Scope**: 外部 (GitHub 开源项目 + 技术架构研究)
- **Date**: 2026-05-03

## Findings

### 一、主要开源项目列表

#### 1. 成熟度较高的项目

| 项目名称 | GitHub 链接 | Stars | 技术栈 | 简介 |
|---------|------------|-------|--------|------|
| **sugyan/claude-code-webui** | https://github.com/sugyan/claude-code-webui | ~1016 | TypeScript, Express, xterm.js | 最流行的 Claude Code Web UI，提供聊天界面和流式响应 |
| **siteboon/claudecodeui (CloudCLI)** | https://github.com/siteboon/claudecodeui | N/A | TypeScript, React, Express | 支持多代理 (Claude/Codex/Gemini) 的完整 Web UI，有云服务版本 |
| **vultuk/claude-code-web** | https://github.com/vultuk/claude-code-web | ~60 | JavaScript, node-pty, xterm.js | 多会话支持的 Web 终端界面 |
| **xhoanggiang/yepanywhere** | https://github.com/xhoanggiang/yepanywhere | N/A | TypeScript, E2E加密 | 自托管 Web UI，支持推送通知、文件上传、端到端加密 |
| **extropolis/claudia** | https://github.com/extropolis/claudia | N/A | React, Vite, Electron, Rust | 多任务管理的 Web UI，支持 Electron 桌面应用 |
| **Ark0N/Codeman** | https://github.com/Ark0N/Codeman | N/A | Fastify, xterm.js, tmux | 基于 tmux 会话管理的移动优化 Web UI |

#### 2. 官方方案

| 方案 | 文档链接 | 特点 |
|------|---------|------|
| **Claude Code Remote Control** | https://docs.anthropic.com/en/docs/claude-code/remote-control | Anthropic 官方远程控制功能，通过 claude.ai/code 或移动应用连接本地会话 |
| **Claude Code on the Web** | https://code.claude.com/docs/en/claude-code-on-the-web | 官方云端运行环境，支持 `--remote` 和 `--teleport` 会话迁移 |

#### 3. 其他相关项目

| 项目名称 | 特点 |
|---------|------|
| **conduit-cli/conduit** | Rust + Ratatui TUI，支持本地 Web UI，多代理支持 |
| **deepsteve/deepsteve** | macOS 专用，多终端 AI 代理管理 |
| **comfortablynumb/claudito** | 轻量级 Web 界面，Ralph Loop 支持 |
| **d-kimuson/claude-code-viewer** | PWA 支持，专注于会话日志分析 |
| **lhymes/claude-web-terminal** | Tailscale VPN 保护，移动优化终端 |
| **friddle/claude-web-remote** | Go 服务器，Piko 隧道，多 AI 工具支持 |
| **robertzsun-dev/claude-code-anywhere** | API 级别拦截，结构化会话数据 |
| **abhishekray07/console** | 多会话管理，Git worktree 隔离 |
| **EdanStarfire/claudecode_webui** | FastAPI + Vue 3，支持多 minion 编排 |
| **Genuifx/claude-code-env-manager** | Tauri 2.0 桌面应用，支持 Telegram 远程控制 |
| **johmara/openclaude** | 终端 TUI，流式 markdown 渲染 |
| **agentsview** | Go + SQLite，多代理会话浏览器 |

---

### 二、技术栈分析

#### 前端技术

| 技术 | 使用项目 | 用途 |
|------|---------|------|
| **xterm.js** | 几乎所有项目 | 浏览器终端模拟器，支持 ANSI 颜色、UTF-8、Unicode |
| **React** | claudia, CloudCLI, 多数项目 | UI 框架 |
| **Vue 3** | EdanStarfire/claudecode_webui | UI 框架 |
| **Vite** | claudia, 多数现代项目 | 构建工具 |
| **Tailwind CSS** | 多数项目 | 样式框架 |
| **shadcn/ui** | 部分项目 | UI 组件库 |
| **Tauri 2.0** | claude-code-env-manager | 桌面应用包装 |

#### 后端技术

| 技术 | 使用项目 | 用途 |
|------|---------|------|
| **node-pty** | 几乎所有 Node.js 项目 | PTY 进程管理，创建伪终端 |
| **Express** | sugyan, CloudCLI, vultuk | HTTP 服务器 |
| **FastAPI** | EdanStarfire/claudecode_webui | Python 后端框架 |
| **Socket.IO / ws** | 所有项目 | WebSocket 实时通信 |
| **Go + Fastify** | Codeman | 高性能后端 |

#### 会话持久化

| 技术 | 用途 |
|------|------|
| **tmux** | 会话持久化，detach/reattach |
| **dtach** | 轻量级会话持久化 |
| **SQLite** | 会话元数据存储 |
| **JSONL 文件** | Claude Code 原生会话格式 (`~/.claude/projects/`) |

#### 远程访问方案

| 方案 | 特点 | 使用项目 |
|------|------|---------|
| **Tailscale VPN** | 零配置安全访问，无公网端口 | claude-web-terminal, wolfpack-bridge |
| **Cloudflare Tunnel** | HTTPS 隧道，无需公网 IP | claude-code-remote |
| **ngrok** | 快速隧道 | claudia |
| **Piko** | 自托管隧道 | friddle/claude-web-remote |
| **SRP-6a + TweetNaCl** | 端到端加密 | yepanywhere |

---

### 三、架构模式总结

#### 模式 1: PTY 代理模式 (最常见)

```
Browser (xterm.js)
    |
    | WebSocket
    v
Node.js Server (node-pty)
    |
    | forkpty(3)
    v
Claude Code CLI Process
```

**代表项目**: sugyan/claude-code-webui, vultuk/claude-code-web, CloudCLI

**优点**:
- 完整的终端体验
- 支持所有交互式功能
- ANSI 颜色和控制序列完整保留

**缺点**:
- 需要在服务器端运行 Node.js
- 输出解析复杂 (需要解析 ANSI 转义序列)
- 移动端体验需要额外优化

#### 模式 2: tmux 会话模式

```
Browser (xterm.js)
    |
    | WebSocket
    v
Server (ttyd 或自定义)
    |
    | tmux -L <socket>
    v
tmux session -> Claude Code CLI
```

**代表项目**: Codeman, claude-web-terminal, claude-code-remote

**优点**:
- 会话持久化 (服务器重启后仍可恢复)
- 支持多窗口/面板
- 原生 detach/reattach

**缺点**:
- 需要 tmux 依赖
- 配置相对复杂

#### 模式 3: Agent SDK 模式

```
Browser (React/Vue UI)
    |
    | HTTP/WebSocket
    v
FastAPI/Express Server
    |
    | Claude Agent SDK
    v
Claude API (结构化数据)
```

**代表项目**: yepanywhere, EdanStarfire/claudecode_webui

**优点**:
- 结构化数据 (消息、工具调用、思考块)
- 更容易构建丰富的 UI
- 不需要解析 ANSI 转义序列

**缺点**:
- 依赖 Agent SDK API
- 可能不支持所有 CLI 功能

#### 模式 4: API 拦截模式

```
Claude Code CLI
    |
    | API 拦截 (代理)
    v
Interceptor Server -> 结构化数据
    |
    | WebSocket
    v
Browser (结构化 Web Viewer)
```

**代表项目**: robertzsun-dev/claude-code-anywhere

**优点**:
- 完整的结构化数据访问
- 无需修改 Claude Code 本身

**缺点**:
- 实现复杂
- 需要处理认证转发

---

### 四、关键设计决策

#### 4.1 终端模拟器选择

**xterm.js** 是事实标准:
- VS Code、Hyper、Theia 等主流编辑器使用
- 丰富的插件生态:
  - `@xterm/addon-attach`: WebSocket 附加
  - `@xterm/addon-fit`: 自适应大小
  - `@xterm/addon-web-links`: 链接检测
  - `@xterm/addon-search`: 搜索功能
  - `@xterm/addon-webgl`: WebGL 渲染加速

#### 4.2 会话管理

**关键需求**:
1. **多会话支持**: 同时运行多个 Claude Code 实例
2. **会话持久化**: 浏览器关闭后恢复
3. **会话历史**: 浏览和恢复历史对话
4. **跨设备同步**: 在不同设备间切换

**实现方式**:
- JSONL 文件读取 (`~/.claude/projects/*/JSONL`)
- SQLite 数据库索引
- 内存 Ring Buffer (重连回放)

#### 4.3 移动端优化

**挑战**:
- 屏幕尺寸限制
- 触摸交互 vs 键盘交互
- 虚拟键盘遮挡

**解决方案**:
- 响应式布局 (CloudCLI, Codeman)
- 专门的移动视图 (Codeman 的触摸优化界面)
- PWA 支持 (离线缓存、主屏幕安装)
- 推送通知 (yepanywhere)

#### 4.4 安全考量

**风险点**:
- 终端访问 = 完整 shell 权限
- 网络暴露 = 远程代码执行

**缓解措施**:
1. **本地绑定**: 默认 127.0.0.1
2. **认证**:
   - 随机 Token (EdanStarfire/claudecode_webui)
   - 密码保护 (claude-code-remote)
   - HttpOnly Cookie
3. **网络隔离**:
   - Tailscale VPN (claude-web-terminal)
   - Cloudflare Tunnel
4. **端到端加密**:
   - SRP-6a + TweetNaCl (yepanywhere)

---

### 五、可借鉴的设计点

#### 5.1 UI/UX 设计

| 设计点 | 来源 | 描述 |
|--------|------|------|
| 聊天界面 vs 终端界面 | sugyan | 提供聊天式界面，更友好的交互体验 |
| 分屏视图 | vultuk | VS Code 风格的标签页分屏 |
| 项目选择器 | 多数项目 | 可视化选择工作目录 |
| 工具权限管理 | sugyan | 细粒度的工具访问控制 |
| 主题切换 | 所有项目 | 深色/浅色主题支持 |
| 侧边栏会话列表 | CloudCLI | 会话历史和项目管理 |
| Git 集成 | CloudCLI | 文件浏览器、Git 操作界面 |

#### 5.2 架构设计

| 设计点 | 来源 | 描述 |
|--------|------|------|
| 环形缓冲区 | vultuk | 重连时回放最近的输出 |
| 自动重连 | 所有项目 | WebSocket 断开后自动重连 |
| 进程生命周期管理 | node-pty | 正确处理子进程退出和清理 |
| 流量控制 | node-pty | 防止输出过快导致缓冲区溢出 |

#### 5.3 功能特性

| 特性 | 来源 | 描述 |
|------|------|------|
| 文件上传 | yepanywhere | 从手机上传截图、PDF、代码文件 |
| 推送通知 | yepanywhere | 需要审批时推送提醒 |
| 会话分支 | yepanywhere | 从任意消息点分叉对话 |
| 语音输入 | claudia | Deepgram 语音转文字 |
| 多代理支持 | CloudCLI, Codeman | Claude Code、Codex、Gemini CLI |
| 计划模式检测 | vultuk | 检测 Claude 的计划模式并提供审批 UI |
| 使用统计 | claude-code-env-manager | Token 使用、成本估算热力图 |

---

### 六、推荐方案

基于研究结果，针对不同需求场景推荐以下方案:

#### 场景 1: 个人使用，本地开发

**推荐**: **sugyan/claude-code-webui**

理由:
- 最成熟的实现 (1000+ Stars)
- 活跃维护
- 聊天式 UI 更友好
- 移动端响应式支持
- NPX 一键启动: `npx claude-code-webui`

#### 场景 2: 多代理管理，团队使用

**推荐**: **CloudCLI (siteboon/claudecodeui)**

理由:
- 支持 Claude Code、Codex、Gemini CLI、Cursor CLI
- 有云服务选项 (团队共享)
- 完整的文件浏览器和 Git 集成
- REST API 支持

#### 场景 3: 移动优先，自托管

**推荐**: **yepanywhere** 或 **Codeman**

理由:
- 移动端优化 UI
- 推送通知支持
- 文件上传功能
- 端到端加密远程访问

#### 场景 4: 安全隔离，企业环境

**推荐**: **claude-web-terminal** + Tailscale

理由:
- Tailscale VPN 零信任网络
- 无公网端口暴露
- 完整的终端功能

---

### 七、技术实现要点

#### 7.1 核心 WebSocket 协议

```javascript
// 服务端 -> 客户端
{
  "type": "data",
  "data": "<base64_output>"
}
{
  "type": "resized",
  "rows": 24,
  "cols": 80
}
{
  "type": "session_ended",
  "exit_code": 0
}

// 客户端 -> 服务端
{
  "type": "input",
  "data": "ls\r"
}
{
  "type": "resize",
  "rows": 40,
  "cols": 120
}
```

#### 7.2 node-pty 基本用法

```javascript
const pty = require('node-pty');

const ptyProcess = pty.spawn('claude', [], {
  name: 'xterm-256color',
  cols: 80,
  rows: 24,
  cwd: process.env.HOME,
  env: process.env
});

ptyProcess.on('data', (data) => {
  websocket.send(data);
});

websocket.on('message', (data) => {
  ptyProcess.write(data);
});
```

#### 7.3 xterm.js 前端集成

```javascript
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { AttachAddon } from '@xterm/addon-attach';

const term = new Terminal({
  theme: { /* ... */ }
});
const fitAddon = new FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

const socket = new WebSocket('ws://localhost:8080');
const attachAddon = new AttachAddon(socket);
term.loadAddon(attachAddon);
```

---

### 八、Not Found / 待研究

1. **Windows 原生支持**: 多数项目在 Windows 上可能有兼容性问题 (node-pty 的 Windows ConPTY 支持)
2. **离线模式**: 暂未找到完全离线工作的方案 (Claude API 需要网络)
3. **多用户隔离**: 大多数项目假设单用户，多用户隔离需要额外开发
4. **审计日志**: 企业级审计日志功能较少涉及

---

## 相关 Specs

暂无相关规范文件。

## Caveats / 注意事项

1. **许可证**: CloudCLI 使用 AGPL-3.0，商业使用需注意
2. **Anthropic 官方**: Remote Control 功能已有官方支持，自建方案需评估必要性
3. **安全性**: 终端 Web UI 暴露完整 shell 权限，务必做好安全防护
4. **Windows 兼容**: node-pty 在 Windows 上使用 ConPTY，可能有差异
