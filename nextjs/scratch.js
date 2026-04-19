require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const apiKey = process.env.ANTHROPIC_API_KEY;
async function test() {
  try {
    const messages = [{ role: 'user', content: 'Generate a short JSON array of 2 test cases object. Follow schema: [{"scenario": "login"}] Return ONLY JSON.' }];
    const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: 'llama3-70b-8192',
      messages: messages,
      max_tokens: 4000,
    }, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    console.log("Success:", response.data.choices[0].message.content);
  } catch(e) {
    console.log("Error:", e.response ? e.response.data : e.message);
  }
}
test();
