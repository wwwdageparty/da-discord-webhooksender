🌍 **[English](README.md)** | 🇨🇳 **[中文](README_cn.md)**

# Da Discord Webhook Sender

This Cloudflare Worker acts as a versatile proxy, allowing you to send messages and attachments to your Discord channels via webhooks from various sources. It handles both file uploads (multipart/form-data) and messages with external attachment URLs (JSON payloads), providing a convenient bridge to your Discord server.

---

## Features

* **POST Request Enforcement:** Only accepts `POST` requests, ensuring secure and intended usage.
* **Multiple Webhook Support:** Configure multiple Discord webhook URLs, separated by semicolons, to send messages to various channels or as a fallback mechanism.
* **Flexible Content Handling:**
    * **File Uploads:** Supports `multipart/form-data` for direct file uploads (e.g., from HTML forms).
    * **JSON Payloads:** Accepts `application/json` for sending text messages and fetching external files as attachments (e.g., from APIs or automated scripts).
* **Attachment Size Limit:** Automatically filters out files larger than 10MB to comply with Discord's typical limits.
* **Robust Error Handling:** Provides informative responses for misconfigurations, unsupported content types, and failures in sending to Discord.

---

## How it Works

The worker intercepts incoming `POST` requests. Depending on the `Content-Type` header:

* **`multipart/form-data`**: It extracts the `content` field for the message and a `file` field for attachments.
* **`application/json`**: It expects a `content` field for the message and an `attachments` array containing URLs of files to be fetched and sent to Discord.

Once processed, the worker constructs a Discord-compatible `FormData` payload and attempts to send it to the configured webhook URLs. If successful, it returns a 200 OK. If all webhooks fail, it provides an error message.

---

## Setup and Deployment

This project is designed for deployment on [Cloudflare Workers](https://workers.cloudflare.com/).

### 1. Create a Cloudflare Worker

If you haven't already, create a new Worker in your Cloudflare dashboard.

### 2. Configure Environment Variables

The worker relies on a single environment variable for your Discord webhook URLs.

* In your Cloudflare Worker's settings, navigate to **Settings > Variables**.
* Add a new environment variable:
    * **Variable name:** `WEBHOOK`
    * **Value:** Enter one or more Discord webhook URLs, separated by semicolons (`;`).
        * Example: `https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN;https://discord.com/api/webhooks/ANOTHER_ID/ANOTHER_TOKEN`

### 3. Deploy the Worker Code

Copy the contents of `src/worker.js` into your Cloudflare Worker's script editor and deploy it.

---

## Usage

Once deployed, send `POST` requests to your Worker's URL.

### 1. Sending Messages with File Uploads (multipart/form-data)

This is ideal for integrating with HTML forms or tools that handle direct file uploads.

**Example HTML Form:**

```html
<form action="YOUR_WORKER_URL" method="post" enctype="multipart/form-data">
    <input type="text" name="content" placeholder="Your message content">
    <input type="file" name="file">
    <button type="submit">Send to Discord</button>
</form>
```