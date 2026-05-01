const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const GITLAB_TOKEN = process.env.GITLAB_TOKEN;
const PROJECT_ID = process.env.PROJECT_ID;
const GITLAB_URL = 'https://gitlab.com/api/v4';
const FILE_PATH = 'prompts.json';

// Get all prompts
app.get('/api/prompts', async (req, res) => {
  try {
    console.log('Fetching from GitLab...');
    
    const response = await axios.get(
      `${GITLAB_URL}/projects/${PROJECT_ID}/repository/files/${encodeURIComponent(FILE_PATH)}/raw?ref=main`,
      { 
        headers: { 'Authorization': `Bearer ${GITLAB_TOKEN}` }
      }
    );
    
    const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
    res.json(data);
  } catch (error) {
    console.error('Error fetching prompts:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch prompts', details: error.message });
  }
});

// Add/Update prompts
app.post('/api/prompts', async (req, res) => {
  try {
    const { prompts } = req.body;
    const content = JSON.stringify({ prompts }, null, 2);

    console.log('Getting file info...');

    // Get current file
    const fileResponse = await axios.get(
      `${GITLAB_URL}/projects/${PROJECT_ID}/repository/files/${encodeURIComponent(FILE_PATH)}?ref=main`,
      { 
        headers: { 'Authorization': `Bearer ${GITLAB_TOKEN}` }
      }
    );

    console.log('Updating GitLab file...');

    // Update file
    const updateResponse = await axios.put(
      `${GITLAB_URL}/projects/${PROJECT_ID}/repository/files/${encodeURIComponent(FILE_PATH)}`,
      {
        content: content,
        commit_message: `Updated prompts at ${new Date().toISOString()}`,
        branch: 'main'
      },
      { 
        headers: { 'Authorization': `Bearer ${GITLAB_TOKEN}` }
      }
    );

    console.log('Update successful!');
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating prompts:', error.response?.status, error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update prompts', details: error.response?.data || error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));