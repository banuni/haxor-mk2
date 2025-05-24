// import { Hono } from 'hono';
// import { chatManager } from '../lib/chatManager';

// const messages = new Hono();

// // Get recent messages
// messages.get('/', async (c) => {
//   const limit = Number(c.req.query('limit')) || 50;
//   const messages = await chatManager.getRecentMessages(limit);
//   return c.json(messages);
// });

// // Add a new message
// messages.post('/', async (c) => {
//   const { userId, content } = await c.req.json();
//   const message = await chatManager.addMessage(userId, content);
//   if (!message) {
//     return c.json({ error: 'User not found' }, 404);
//   }
//   return c.json(message);
// });

// // Clear all messages
// messages.delete('/', async (c) => {
//   await chatManager.clearMessages();
//   return c.json({ success: true });
// });

// export default messages; 