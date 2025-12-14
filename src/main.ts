#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { setupStdioFiltering } from './stdio-filter.js';
import { log } from './logger.js';
import { parseConfig } from './config.js';
import { BotConnection } from './bot-connection.js';
import { ToolFactory } from './tool-factory.js';
import { MessageStore } from './message-store.js';
import { EventManager } from './events/event-manager.js';
import { EventNotifier } from './events/event-notifier.js';
import { registerPositionTools } from './tools/position-tools.js';
import { registerInventoryTools } from './tools/inventory-tools.js';
import { registerBlockTools } from './tools/block-tools.js';
import { registerEntityTools } from './tools/entity-tools.js';
import { registerChatTools } from './tools/chat-tools.js';
import { registerFlightTools } from './tools/flight-tools.js';
import { registerGameStateTools } from './tools/gamestate-tools.js';

setupStdioFiltering();

process.on('unhandledRejection', (reason) => {
  log('error', `Unhandled rejection: ${reason}`);
});

process.on('uncaughtException', (error) => {
  log('error', `Uncaught exception: ${error}`);
});

async function main() {
  const config = parseConfig();
  const messageStore = new MessageStore();

  // 创建事件管理器和通知器
  const eventManager = new EventManager();
  const eventNotifier = new EventNotifier();

  const connection = new BotConnection(
    config,
    {
      onLog: log,
      onChatMessage: (username, message) => messageStore.addMessage(username, message)
    }
  );

  // 将事件管理器传递给连接
  connection.setEventManager(eventManager);

  connection.connect();

  const server = new McpServer({
    name: "Rackster",
    version: "1.0.0"
  });

  // 设置事件通知器
  eventNotifier.setServer(server);
  
  // 监听所有事件并发送通知
  eventManager.on('*', (event) => {
    eventNotifier.notify(event);
  });

  const factory = new ToolFactory(server, connection);
  const getBot = () => connection.getBot()!;

  registerPositionTools(factory, getBot);
  registerInventoryTools(factory, getBot);
  registerBlockTools(factory, getBot);
  registerEntityTools(factory, getBot);
  registerChatTools(factory, getBot, messageStore);
  registerFlightTools(factory, getBot);
  registerGameStateTools(factory, getBot);

  process.stdin.on('end', () => {
    connection.cleanup();
    eventManager.removeAllListeners();
    log('info', 'Rackster has disconnected. Shutting down...');
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  log('error', `Fatal error in main(): ${error}`);
  process.exit(1);
});
