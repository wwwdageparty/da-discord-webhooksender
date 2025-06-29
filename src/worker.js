

export default {
  async fetch(request, env, ctx) {
    if (request.method !== 'POST') {
      return new Response('Only POST allowed', { status: 405 });
    }

    const webhookUrls = (env.WEBHOOK || '').split(';').map(u => u.trim()).filter(Boolean);
    if (webhookUrls.length === 0) {
      return new Response('No webhook configured', { status: 500 });
    }

    const contentType = request.headers.get('content-type') || '';
    let content = '';
    const files = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      content = formData.get('content') || 'Upload';
      const file = formData.get('file');

      if (file && typeof file !== 'string') {
        const size = file.size;
        if (size <= 10 * 1024 * 1024) {
          files.push({ name: file.name, blob: file });
        }
      }

    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      content = body.content || '';
      const attachments = Array.isArray(body.attachments) ? body.attachments : [];

      for (const url of attachments) {
        try {
          const headRes = await fetch(url, { method: 'HEAD' });
          const size = parseInt(headRes.headers.get('content-length') || '0');
          if (headRes.status === 200 && size > 0 && size <= 10 * 1024 * 1024) {
            const getRes = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0',
                'Accept': '*/*'
              }
            });
            if (getRes.ok) {
              const blob = await getRes.blob();
              const name = new URL(url).pathname.split('/').pop() || 'file';
              files.push({ name, blob });
            }
          }
        } catch (_) {
          continue;
        }
      }
    } else {
      return new Response('Unsupported content type', { status: 400 });
    }

    const discordForm = new FormData();
    discordForm.append('payload_json', JSON.stringify({ content }));
    files.forEach((file, i) => {
      discordForm.append(`file${i}`, file.blob, file.name);
    });

    let lastError = null;
    for (const webhook of webhookUrls) {
      try {
        const res = await fetch(webhook, {
          method: 'POST',
          body: discordForm
        });
        if (res.ok) {
          return new Response('Message sent to Discord', { status: 200 });
        }
        lastError = await res.text();
      } catch (err) {
        lastError = err.toString();
      }
    }

    return new Response('All webhooks failed. Last error: ' + lastError, { status: 500 });
  }
};
