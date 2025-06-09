import { type Message } from "db/schema";

export function buildMessagesString(messages: Message[]) {
  return messages
    .map((message) => `${message.fromName}: ${message.content}`)
    .join("\n");
}
