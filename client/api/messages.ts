import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';

export interface Message {
  id: string;
  fromName: string;
  fromRole: string;
  content: string;
  createdAt: Date;
  clearedAt: Date | null;
}

// Fetch messages
async function fetchMessages(limit = 50): Promise<Message[]> {
  const res = await fetch(`/api/messages?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

// Add a message
async function addMessage({ userId, content }: { userId: string; content: string }): Promise<Message> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, content }),
  });
  if (!res.ok) throw new Error('Failed to add message');
  return res.json();
}

// Clear messages
async function clearMessages(): Promise<void> {
  const res = await fetch('/api/messages', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear messages');
}

// React Query hooks
export function useMessages(limit = 50) {
  return useQuery({
    queryKey: ['messages', limit],
    queryFn: () => fetchMessages(limit),
  });
}

export function useAddMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useClearMessages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearMessages,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
} 