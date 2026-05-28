export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const messages = (req.body.messages || []).map(msg => {
      if (!Array.isArray(msg.content)) return msg;
      return {
        ...msg,
        content: msg.content.filter(block => {
          if (block.type !== 'image') return true;
          const mediaType = block.source && block.source.media_type;
          return supportedTypes.includes(mediaType);
        }).map(block => {
          if (block.type !== 'image') return block;
          return {
            ...block,
            source: {
              ...block.source,
              media_type: 'image/jpeg'
            }
          };
        })
      };
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: messages
      })
    });

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
