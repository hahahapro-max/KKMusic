import axios from 'axios';

export default async function handler(req, res) {
  // Get the path from the query string (passed by vercel.json rewrite)
  // or construct it from the url if needed.
  // vercel.json: { "source": "/netease/:match*", "destination": "/api/netease?path=/:match*" }
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: 'Path is required' });
  }

  // Construct the target URL
  // Note: path comes in as array or string depending on match
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  // Handle case where path might start with / or not
  const cleanPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const targetUrl = `http://music.163.com${cleanPath}`;

  // Forward query parameters (excluding the 'path' param used for routing)
  const queryParams = { ...req.query };
  delete queryParams.path;

  try {
    const response = await axios({
      method: req.method,
      url: targetUrl,
      params: queryParams,
      headers: {
        'Referer': 'http://music.163.com/',
        'Origin': 'http://music.163.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        // Forward content-type if present (e.g. for POST)
        ...(req.headers['content-type'] ? { 'Content-Type': req.headers['content-type'] } : {}),
        // We might need to handle cookies if user login is required, 
        // but for search/play anon is usually fine.
      },
      data: req.body,
      responseType: 'arraybuffer' // Handle binary data if any, or text
    });

    // Set CORS headers for the client
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // Forward the status and headers from Netease (selectively)
    // res.status(response.status); // Vercel might complain if status is weird
    
    // Set content type
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }

    // Send data
    res.send(response.data);

  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
       res.status(error.response.status).json(error.response.data ? JSON.parse(error.response.data.toString()) : { error: 'Upstream error' });
    } else {
       res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
