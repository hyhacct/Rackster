/**
 * 事件通知器 - 负责将事件发送给 AI
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { MinecraftEvent } from './event-types.js';
import { EventSeverity } from './event-types.js';
import { log } from '../logger.js';

export class EventNotifier {
  private server: McpServer | null = null;
  private enabled = true;
  private importantEventTypes: Set<string>;

  constructor() {
    // 定义重要事件类型，这些事件会被发送给 AI
    this.importantEventTypes = new Set([
      'chat',
      'death',
      'respawn',
      'kicked',
      'error',
      'entity_hurt',
      'entity_death',
      'block_break',
      'block_place',
      'item_collect',
      'damage',
      'health_change',
      'gamemode_change',
      'spawn',
      'login'
    ]);
  }

  /**
   * 设置 MCP 服务器实例
   */
  setServer(server: McpServer): void {
    this.server = server;
  }

  /**
   * 启用或禁用通知
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 添加重要事件类型
   */
  addImportantEventType(eventType: string): void {
    this.importantEventTypes.add(eventType);
  }

  /**
   * 移除重要事件类型
   */
  removeImportantEventType(eventType: string): void {
    this.importantEventTypes.delete(eventType);
  }

  /**
   * 发送事件通知
   */
  async notify(event: MinecraftEvent): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      // 判断是否应该发送通知
      const shouldNotify = 
        this.importantEventTypes.has(event.type) ||
        event.severity === EventSeverity.ERROR ||
        event.severity === EventSeverity.WARNING;

      if (!shouldNotify) {
        return;
      }

      // 格式化事件消息
      const eventMessage = this.formatEventForAI(event);

      // 尝试通过 MCP 服务器发送通知
      if (this.server) {
        await this.sendMcpNotification(eventMessage, event);
      } else {
        // 如果没有服务器实例，使用日志记录
        log('info', `[事件通知] ${eventMessage}`);
      }
    } catch (error) {
      log('error', `发送事件通知时出错: ${error}`);
    }
  }

  /**
   * 通过 MCP 协议发送通知
   */
  private async sendMcpNotification(message: string, event: MinecraftEvent): Promise<void> {
    if (!this.server) {
      return;
    }

    try {
      // MCP SDK 可能使用不同的 API，这里尝试多种方式
      // 方式1: 使用 server.notification() 方法（如果存在）
      if (typeof (this.server as any).notification === 'function') {
        await (this.server as any).notification('minecraft/event', {
          message,
          event: {
            type: event.type,
            severity: event.severity,
            timestamp: event.timestamp,
            data: event.data
          }
        });
        return;
      }

      // 方式2: 使用 server.sendNotification() 方法（如果存在）
      if (typeof (this.server as any).sendNotification === 'function') {
        await (this.server as any).sendNotification('minecraft/event', {
          message,
          event: {
            type: event.type,
            severity: event.severity,
            timestamp: event.timestamp,
            data: event.data
          }
        });
        return;
      }

      // 方式3: 使用 prompts 机制（如果支持）
      // MCP 协议支持 prompts，可以将事件作为 prompt 发送
      if (typeof (this.server as any).prompt === 'function') {
        await (this.server as any).prompt('minecraft_event', {
          messages: [{
            role: 'system',
            content: {
              type: 'text',
              text: message
            }
          }]
        });
        return;
      }

      // 如果都不支持，使用日志记录
      log('info', `[事件通知] ${message}`);
    } catch (error) {
      // 如果发送失败，回退到日志记录
      log('warn', `无法通过 MCP 发送通知，使用日志记录: ${error}`);
      log('info', `[事件通知] ${message}`);
    }
  }

  /**
   * 格式化事件消息供 AI 使用
   */
  private formatEventForAI(event: MinecraftEvent): string {
    const timestamp = new Date(event.timestamp).toLocaleTimeString('zh-CN');
    const severityEmoji = {
      [EventSeverity.INFO]: 'ℹ️',
      [EventSeverity.WARNING]: '⚠️',
      [EventSeverity.ERROR]: '❌',
      [EventSeverity.SUCCESS]: '✅'
    }[event.severity] || '📌';

    let message = `${severityEmoji} [${timestamp}] ${event.description}`;

    // 添加额外的数据信息
    if (event.data) {
      const dataStr = this.formatEventData(event.data);
      if (dataStr) {
        message += `\n   详情: ${dataStr}`;
      }
    }

    return message;
  }

  /**
   * 格式化事件数据
   */
  private formatEventData(data: Record<string, unknown>): string {
    const parts: string[] = [];

    if (data.position) {
      const pos = data.position as { x: number; y: number; z: number };
      parts.push(`位置: (${pos.x}, ${pos.y}, ${pos.z})`);
    }

    if (data.username) {
      parts.push(`玩家: ${data.username}`);
    }

    if (data.health !== undefined && data.maxHealth !== undefined) {
      parts.push(`生命值: ${data.health}/${data.maxHealth}`);
    }

    if (data.entityType) {
      parts.push(`实体类型: ${data.entityType}`);
    }

    if (data.blockName) {
      parts.push(`方块: ${data.blockName}`);
    }

    if (data.reason) {
      parts.push(`原因: ${data.reason}`);
    }

    if (data.message) {
      parts.push(`消息: ${data.message}`);
    }

    return parts.join(', ');
  }
}
