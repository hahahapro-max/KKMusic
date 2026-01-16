import axios from 'axios';

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 2. Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 3. Extract Path
  const { path } = req.query;
  
  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  // Handle path being an array (wildcard match) or string
  const pathStr = Array.isArray(path) ? path.join('/') : path;
  const cleanPath = (pathStr.startsWith('/') ? pathStr : `/${pathStr}`).replace(/^\/+/, '/');
  
  // 4. Construct Target URL
  const targetUrl = `https://music.163.com${cleanPath}`;

  // 5. Prepare Query Params (remove 'path' which is internal routing)
  const queryParams = { ...req.query };
  delete queryParams.path;

  try {
    const fakeIp = '118.88.88.88';
    // 6. Proxy Request
    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: queryParams,
      data: req.body,
      headers: {
        'Referer': 'https://music.163.com/',
        'Origin': 'https://music.163.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': 'os=pc; appver=2.9.7', // Standard cookie to avoid some blocks
        'X-Real-IP': fakeIp,
        'X-Forwarded-For': fakeIp,
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
      },
      responseType: 'arraybuffer', // Use buffer to handle all data types safely (JSON, text, binary)
      validateStatus: () => true, // Don't throw error on 4xx/5xx, just forward them
      timeout: 15000,
    });

    // 7. Forward Status
    res.status(response.status);

    // 8. Forward Content-Type
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }

    // 9. Send Data
    res.send(response.data);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    res.status(500).json({ 
      error: 'Proxy Error', 
      message: error.message,
      target: targetUrl 
    });
  }
}
