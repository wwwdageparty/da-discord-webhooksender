🌍 **[English](README.md)** | 🇨🇳 **[中文](README_cn.md)**

# Da Discord Webhook Sender

此 Cloudflare Worker 是 **wwwdageparty** 的一个重要组成部分，专门设计用于通过 Webhook 向 Discord 频道发送消息。它作为一个专用的代理，高效处理直接文件上传 (`multipart/form-data`) 和包含外部附件 URL 的消息（通过 `application/json` 有效负载），确保 wwwdageparty 与 Discord 服务器之间的无缝连接。

---

## 功能特性

* **强制 POST 请求:** 只接受 `POST` 请求，确保安全和预期使用。
* **多 Webhook 支持:** 配置多个 Discord Webhook URL（用分号分隔），可将消息发送到不同的频道，或作为故障转移机制。
* **灵活的内容处理:**
    * **文件上传:** 支持 `multipart/form-data` 用于直接文件上传（例如，来自 HTML 表单）。
    * **JSON 有效负载:** 接受 `application/json`，用于发送文本消息和作为附件抓取外部文件（例如，来自 API 或自动化脚本）。
* **附件大小限制:** 自动过滤掉大于 10MB 的文件，以符合 Discord 的常见限制。
* **健壮的错误处理:** 为配置错误、不支持的内容类型以及发送到 Discord 失败提供有用的响应。

---

## 工作原理

该 Worker 拦截传入的 `POST` 请求。根据 `Content-Type` 标头：

* **`multipart/form-data`**: 它提取 `content` 字段作为消息内容，并提取 `file` 字段作为附件。
* **`application/json`**: 它期望一个 `content` 字段作为消息内容，以及一个 `attachments` 数组，其中包含要抓取并发送到 Discord 的文件 URL。

处理完成后，Worker 会构建一个 Discord 兼容的 `FormData` 有效负载，并尝试将其发送到配置的 Webhook URL。如果成功，它将返回 200 OK。如果所有 Webhook 都失败，它将提供一个错误消息。

---

## 设置与部署

本项目旨在部署在 [Cloudflare Workers](https://workers.cloudflare.com/) 上。

### 1. 创建 Cloudflare Worker

如果您尚未创建，请在您的 Cloudflare 控制台中创建一个新的 Worker。

### 2. 配置环境变量

Worker 依赖一个环境变量来获取您的 Discord Webhook URL。

* 在您的 Cloudflare Worker 设置中，导航到 **设置 > 变量**。
* 添加一个新的环境变量：
    * **变量名:** `WEBHOOK`
    * **值:** 输入一个或多个 Discord Webhook URL，用分号（`;`）分隔。
        * 示例: `https://discord.com/api/webhooks/您的ID/您的TOKEN;https://discord.com/api/webhooks/另一个ID/另一个TOKEN`

### 3. 部署 Worker 代码

将 `worker.js` 的内容复制到您的 Cloudflare Worker 脚本编辑器中并进行部署。

---

## 使用方法

部署后，向您的 Worker URL 发送 `POST` 请求。

### 1. 发送带文件上传的消息 (multipart/form-data)

这非常适合与 HTML 表单或处理直接文件上传的工具集成。

**HTML 表单示例:**

```html
<form action="您的WORKER_URL" method="post" enctype="multipart/form-data">
    <input type="text" name="content" placeholder="您的消息内容">
    <input type="file" name="file">
    <button type="submit">发送到 Discord</button>
</form>
```