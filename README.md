# 心率直播

实时查看小米手环9心率数据的网站。主机设备通过蓝牙连接手环，将心率数据推送到服务器，其他设备可以通过网站实时查看。

## 使用方法

### 1. 启动服务

```bash
# 安装依赖
npm install

# 同时启动 Next.js 和 WebSocket 服务器
npm run dev:all
```

或者分别启动：

```bash
# 终端 1: 启动 WebSocket 服务器
npm run dev:server

# 终端 2: 启动 Next.js 开发服务器
npm run dev
```

### 2. 主机操作 (连接手环)

1. 在手机 Chrome 浏览器打开 `http://你的IP:3000/host`
2. 点击「连接手环开始广播」
3. 在弹出的蓝牙设备列表中选择你的小米手环9
4. 确保手环已在小米运动健康 App 中开启心率广播

### 3. 观众查看

1. 在任意设备浏览器打开 `http://你的IP:3000`
2. 等待主机连接手环后即可看到实时心率

## 技术要求

- **浏览器:** Chrome 或 Edge (需要 Web Bluetooth 支持)
- **手环:** 小米手环9，需在小米运动健康 App 中开启心率广播
- **网络:** 主机和观众需要能访问同一服务器

## 技术架构

```
小米手环9 ──BLE──> 手机(主机) ──WebSocket──> 服务器 ──WebSocket──> 观众设备
```

- **前端:** Next.js + Tailwind CSS + Motion
- **WebSocket 服务器:** Node.js + ws
- **BLE 连接:** Web Bluetooth API

## 部署

### WebSocket 服务器

WebSocket 服务器需要单独部署，可以使用 Railway、Render 或任何支持 Node.js 的平台。

### 前端

前端可以部署到 Vercel 或 Cloudflare Pages。需要修改 `lib/websocket.ts` 中的 WebSocket 地址为你的服务器地址。
