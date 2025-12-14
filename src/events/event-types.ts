/**
 * Minecraft 事件类型定义
 */

import type { Bot } from 'mineflayer';
import type { Vec3 } from 'vec3';

/**
 * 事件严重程度
 */
export enum EventSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  SUCCESS = 'success'
}

/**
 * 基础事件接口
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  severity: EventSeverity;
  description: string;
  data?: Record<string, unknown>;
}

/**
 * 连接相关事件
 */
export interface ConnectionEvent extends BaseEvent {
  type: 'connection' | 'disconnection' | 'login' | 'spawn' | 'kicked' | 'end';
  data?: {
    reason?: string;
    host?: string;
    port?: number;
    username?: string;
  };
}

/**
 * 聊天事件
 */
export interface ChatEvent extends BaseEvent {
  type: 'chat';
  data: {
    username: string;
    message: string;
    isBot?: boolean;
  };
}

/**
 * 实体事件
 */
export interface EntityEvent extends BaseEvent {
  type: 'entity_hurt' | 'entity_death' | 'entity_spawn' | 'entity_gone' | 'entity_moved';
  data: {
    entityId?: number;
    entityType?: string;
    entityName?: string;
    position?: { x: number; y: number; z: number };
    health?: number;
    damage?: number;
  };
}

/**
 * 方块事件
 */
export interface BlockEvent extends BaseEvent {
  type: 'block_update' | 'block_break' | 'block_place';
  data: {
    position: { x: number; y: number; z: number };
    blockType?: string;
    blockName?: string;
    oldBlockType?: string;
  };
}

/**
 * 物品事件
 */
export interface ItemEvent extends BaseEvent {
  type: 'item_pickup' | 'item_drop' | 'item_collect' | 'inventory_update';
  data: {
    itemName?: string;
    itemType?: string;
    count?: number;
    slot?: number;
  };
}

/**
 * 伤害事件
 */
export interface DamageEvent extends BaseEvent {
  type: 'damage' | 'health_change';
  data: {
    damage?: number;
    health?: number;
    maxHealth?: number;
    attacker?: string;
    cause?: string;
  };
}

/**
 * 死亡事件
 */
export interface DeathEvent extends BaseEvent {
  type: 'death' | 'respawn';
  data: {
    reason?: string;
    position?: { x: number; y: number; z: number };
  };
}

/**
 * 移动事件
 */
export interface MovementEvent extends BaseEvent {
  type: 'move' | 'jump' | 'fall';
  data: {
    position: { x: number; y: number; z: number };
    velocity?: { x: number; y: number; z: number };
    onGround?: boolean;
  };
}

/**
 * 游戏状态事件
 */
export interface GameStateEvent extends BaseEvent {
  type: 'gamemode_change' | 'time_update' | 'weather_change';
  data: {
    gamemode?: string;
    time?: number;
    weather?: string;
  };
}

/**
 * 错误事件
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  data: {
    error: string;
    code?: string;
    stack?: string;
  };
}

/**
 * 所有事件类型的联合
 */
export type MinecraftEvent =
  | ConnectionEvent
  | ChatEvent
  | EntityEvent
  | BlockEvent
  | ItemEvent
  | DamageEvent
  | DeathEvent
  | MovementEvent
  | GameStateEvent
  | ErrorEvent;

/**
 * 事件监听器类型
 */
export type EventListener = (event: MinecraftEvent) => void | Promise<void>;

/**
 * 事件过滤器类型
 */
export type EventFilter = (event: MinecraftEvent) => boolean;
