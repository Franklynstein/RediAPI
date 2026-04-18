require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
const PORT = 3001;

const API_KEY = process.env.REDIPROFILES_API_KEY;

if (!API_KEY) {
  console.error('Missing required environment variable REDIPROFILES_API_KEY');
  process.exit(1);
}

// Enable CORS for the frontend
app.use(cors());

app.get('/api/services', async (req, res) => {
  try {
    const response = await fetch('https://api.rediprofiles.com/api/v1/services/', {
      headers: {
        'X-API-KEY': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching from API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const response = await fetch('https://api.rediprofiles.com/api/v1/orders/', {
      method: 'POST',
      headers: {
        'X-API-KEY': API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.detail || `API responded with status: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error placing order to API:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});