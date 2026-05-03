# Claude WebUI

一个前端 + Node.js 后端的 Claude Code WebUI 原型。前端使用 Vite/React，后端通过 HTTP + WebSocket 驱动本机 `claude` CLI，并把会话内容持久化到本地 JSONL 文件。

## 目录结构

- `src/`：现有前端
- `server/`：后端服务
- `server/data/`：后端运行时生成的会话数据目录

## 运行前准备

1. 安装 Node.js 18 或更高版本。
2. 在本机安装并确认 `claude` 命令可直接执行。
3. 分别安装前端和后端依赖。

```bash
npm install
cd server
npm install
```

## 一键启动前后端

项目根目录：

```bash
npm run dev:all
```

该命令会并行启动：

- 根目录前端开发服务器
- `server/` 后端开发服务器

前端会沿用 Vite 的自动打开行为，在开发页可访问后自动拉起浏览器。

## 单独启动前端

项目根目录：

```bash
npm run dev
```

也可以显式使用：

```bash
npm run dev:frontend
```

若需要局域网访问，可使用：

```bash
npm run dev -- --host
```

## 后端启动

`server/` 目录：

```bash
npm run dev
```

后端默认监听 `127.0.0.1:4096`，并尝试启动本机 `claude` 命令。

生产构建与运行：

```bash
npm run build
npm start
```

## 后端配置

后端支持 `server/config.json` 和环境变量两种配置方式；环境变量优先级更高。`server/config.json` 已被 `.gitignore` 忽略，适合本地自定义。

示例：

```json
{
  "host": "0.0.0.0",
  "port": 4096,
  "password": "your-password",
  "dataDir": "../data",
  "command": "claude",
  "args": [],
  "defaultCwd": "O:/ClaudeWebUI"
}
```

可用环境变量：

- `CLAUDE_WEBUI_HOST`：监听地址，默认 `127.0.0.1`
- `CLAUDE_WEBUI_PORT`：监听端口，默认 `4096`
- `CLAUDE_WEBUI_PASSWORD`：启用密码保护；为空则不校验
- `CLAUDE_WEBUI_DATA_DIR`：会话数据目录，默认 `server/data`
- `CLAUDE_WEBUI_COMMAND`：启动的 CLI 命令，默认 `claude`
- `CLAUDE_WEBUI_ARGS`：传给 CLI 的参数，使用空格分隔
- `CLAUDE_WEBUI_CWD`：新会话默认工作目录，默认当前进程目录

## API 与连接方式

- `GET /api/health`
- `GET /api/sessions`
- `POST /api/sessions`
- `GET /api/sessions/:sessionId`
- `WS /ws?sessionId=<id>`

启用密码后：

- HTTP 请求可通过 `X-Claude-Webui-Password` 头或 `Authorization: Bearer <password>` 访问
- WebSocket 通过查询参数 `password=<password>` 认证

## 本地开发顺序

1. 推荐在项目根目录执行：`npm run dev:all`
2. 如需确认后端状态，可访问：`http://127.0.0.1:4096/api/health`
3. 如需单独调试，前端仍可在根目录执行 `npm run dev`，后端仍可在 `server/` 目录执行 `npm run dev`

## 手机或局域网访问

如果要从手机访问：

1. 前端使用 `npm run dev -- --host`
2. 后端把 `host` 改成 `0.0.0.0`
3. 确保防火墙放行对应端口
4. 手机与运行机器处于同一局域网，或通过 Tailscale / VPN 访问

## 后端验证命令

`server/` 目录：

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

当前后端测试覆盖：

- JSONL 会话存储回放
- PTY 输出转消息块
- 会话退出后的输入/resize 拦截
- 已退出会话重新附着时不重复拉起 PTY
