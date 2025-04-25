import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { init_image } = req.body;
    const endpoint = init_image
      ? 'https://modelslab.com/api/v6/images/img2img'
      : 'https://modelslab.com/image-generation/flux/fluxtext2img';

    console.log('🌐 Proxying request to:', endpoint);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('❌ Proxy Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
} 