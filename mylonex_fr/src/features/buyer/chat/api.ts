import { portalRequest } from '../../../shared/session/rfq-api'

export type Conversation = { id: string; title: string; updatedAt: string }
export type ChatMessage = { id: string; role: string; content: string; metadata?: {
  responseMode?: 'local' | 'ai'
  inquiries?: { id: string; rfqNumber: string; fabricName: string }[]
  requirement?: Record<string, string | number>
  fabrics?: { id: string; fabricName: string; gsm: number; weaveType: string }[]
} | null }
export type History = { conversation: Conversation; messages: ChatMessage[]; next: string | null }
export const listChats = (before?: string, signal?: AbortSignal) => portalRequest<{ conversations: Conversation[]; next: string | null }>(
  '/buyer/chat/conversations' + (before ? '?before=' + encodeURIComponent(before) : ''), undefined, signal)
export const readChat = (id: string, before?: string, signal?: AbortSignal) => portalRequest<History>(
  '/buyer/chat/conversations/' + encodeURIComponent(id) + (before ? '?before=' + encodeURIComponent(before) : ''), undefined, signal)
export const sendChat = (message: string, conversationId?: string) => portalRequest<{
  conversation: Conversation; userMessage: ChatMessage; message: ChatMessage
}>('/buyer/chat/messages', { message, conversationId }, AbortSignal.timeout(60000))
export const deleteChat = (id: string) => portalRequest('/buyer/chat/conversations/' + encodeURIComponent(id) + '/delete', {})
