import { z } from "zod";
import mineflayer from 'mineflayer';
import { ToolFactory } from '../tool-factory.js';
import { MessageStore } from '../message-store.js';

/**
 * 注册聊天工具
 * @param factory 工具工厂
 * @param getBot 获取机器人实例
 * @param messageStore 消息存储
 */
export function registerChatTools(factory: ToolFactory, getBot: () => mineflayer.Bot, messageStore: MessageStore): void {

  /**
   * 发送聊天消息
   * @param message 消息内容
   * @returns 发送聊天消息的结果
   */
  factory.registerTool(
    "send-chat",
    "Send a chat message in-game",
    {
      message: z.string().describe("Message to send in chat")
    },
    async ({ message }) => {
      const bot = getBot();
      bot.chat(message);
      return factory.createResponse(`Sent message: "${message}"`);
    }
  );

  /**
   * 读取聊天消息
   * @param count 读取的消息数量
   * @returns 读取聊天消息的结果
   */
  factory.registerTool(
    "read-chat",
    "Get recent chat messages from players",
    {
      count: z.number().optional().describe("Number of recent messages to retrieve (default: 10, max: 100)")
    },
    async ({ count = 10 }) => {
      const maxCount = Math.min(count, messageStore.getMaxMessages());
      const messages = messageStore.getRecentMessages(maxCount);

      if (messages.length === 0) {
        return factory.createResponse("No chat messages found");
      }

      let output = `Found ${messages.length} chat message(s):\n\n`;
      messages.forEach((msg, index) => {
        const timestamp = new Date(msg.timestamp).toISOString();
        output += `${index + 1}. ${timestamp} - ${msg.username}: ${msg.content}\n`;
      });

      return factory.createResponse(output);
    }
  );
}
