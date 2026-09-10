import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message } = req.body;
      const chat = ai.chats.create({
        model: 'gemini-3.7-flash',
        config: {
          systemInstruction: 'You are an intelligent, helpful productivity assistant in AI Productivity Studio. Help users organize tasks, brainstorm ideas, summarize notes, and study effectively.',
        }
      });
      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate response' });
    }
  });

  app.post('/api/gemini/summarize', async (req, res) => {
    try {
      const { text, type } = req.body;
      let prompt = `Summarize the following text clearly and concisely:\n\n${text}`;
      if (type === 'actions') {
        prompt = `Extract actionable bullet points and tasks from the following text:\n\n${text}`;
      } else if (type === 'rewrite') {
        prompt = `Improve and polish the following text for professional clarity and flow:\n\n${text}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
      });
      res.json({ result: response.text });
    } catch (error: any) {
      console.error('Summarize error:', error);
      res.status(500).json({ error: error.message || 'Failed to process text' });
    }
  });

  app.post('/api/gemini/flashcards', async (req, res) => {
    try {
      const { topic } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Generate 5 high-yield study flashcards for the topic: "${topic}".`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING, description: 'Flashcard question' },
                answer: { type: Type.STRING, description: 'Flashcard answer' }
              },
              required: ['question', 'answer']
            }
          }
        }
      });
      const flashcards = JSON.parse(response.text || '[]');
      res.json({ flashcards });
    } catch (error: any) {
      console.error('Flashcards error:', error);
      res.status(500).json({ error: error.message || 'Failed to generate flashcards' });
    }
  });

  app.post('/api/gemini/tasks', async (req, res) => {
    try {
      const { goal } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: `Break down the following major goal or project into 4-6 sequential, actionable tasks with estimated time and priority (High, Medium, Low): "${goal}"`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Task title' },
                description: { type: Type.STRING, description: 'Brief description' },
                priority: { type: Type.STRING, description: 'High, Medium, or Low' },
                estimatedTime: { type: Type.STRING, description: 'Estimated time' }
              },
              required: ['title', 'description', 'priority', 'estimatedTime']
            }
          }
        }
      });
      const tasks = JSON.parse(response.text || '[]');
      res.json({ tasks });
    } catch (error: any) {
      console.error('Tasks error:', error);
      res.status(500).json({ error: error.message || 'Failed to break down tasks' });
    }
  });

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Vite dev server middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`AI Productivity Studio server running on port ${PORT}`);
  });
}

startServer();
