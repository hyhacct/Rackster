/**
 * 事件管理器 - 统一管理和分发 Minecraft 事件
 */

import type { MinecraftEvent, EventListener, EventFilter } from './event-types.js';
import { EventSeverity } from './event-types.js';

export class EventManager {
  private listeners: Map<string, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();
  private filters: Set<EventFilter> = new Set();
  private eventHistory: MinecraftEvent[] = [];
  private maxHistorySize: number = 1000;

  /**
   * 注册事件监听器
   * @param eventType 事件类型，如果为 '*' 则监听所有事件
   * @param listener 监听器函数
   */
  on(eventType: string | '*', listener: EventListener): void {
    if (eventType === '*') {
      this.globalListeners.add(listener);
    } else {
      if (!this.listeners.has(eventType)) {
        this.listeners.set(eventType, new Set());
      }
      this.listeners.get(eventType)!.add(listener);
    }
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listener 监听器函数
   */
  off(eventType: string | '*', listener: EventListener): void {
    if (eventType === '*') {
      this.globalListeners.delete(listener);
    } else {
      this.listeners.get(eventType)?.delete(listener);
    }
  }

  /**
   * 添加事件过滤器
   * @param filter 过滤器函数
   */
  addFilter(filter: EventFilter): void {
    this.filters.add(filter);
  }

  /**
   * 移除事件过滤器
   * @param filter 过滤器函数
   */
  removeFilter(filter: EventFilter): void {
    this.filters.delete(filter);
  }

  /**
   * 触发事件
   * @param event 事件对象
   */
  async emit(event: MinecraftEvent): Promise<void> {
    // 应用过滤器
    for (const filter of this.filters) {
      if (!filter(event)) {
        return; // 事件被过滤，不触发
      }
    }

    // 添加到历史记录
    this.addToHistory(event);

    // 触发特定类型的监听器
    const typeListeners = this.listeners.get(event.type);
    if (typeListeners) {
      for (const listener of typeListeners) {
        try {
          await listener(event);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      }
    }

    // 触发全局监听器
    for (const listener of this.globalListeners) {
      try {
        await listener(event);
      } catch (error) {
        console.error('Error in global event listener:', error);
      }
    }
  }

  /**
   * 创建并触发事件
   * @param type 事件类型
   * @param severity 严重程度
   * @param description 事件描述
   * @param data 事件数据
   */
  async createAndEmit(
    type: string,
    severity: EventSeverity,
    description: string,
    data?: Record<string, unknown>
  ): Promise<void> {
    const event: MinecraftEvent = {
      type,
      timestamp: Date.now(),
      severity,
      description,
      data
    } as MinecraftEvent;

    await this.emit(event);
  }

  /**
   * 获取事件历史
   * @param eventType 可选的事件类型过滤
   * @param limit 返回的最大数量
   */
  getHistory(eventType?: string, limit: number = 100): MinecraftEvent[] {
    let events = this.eventHistory;
    
    if (eventType) {
      events = events.filter(e => e.type === eventType);
    }

    return events.slice(-limit);
  }

  /**
   * 清空事件历史
   */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }

  /**
   * 添加事件到历史记录
   */
  private addToHistory(event: MinecraftEvent): void {
    this.eventHistory.push(event);
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 设置历史记录最大大小
   */
  setMaxHistorySize(size: number): void {
    this.maxHistorySize = size;
  }
}
