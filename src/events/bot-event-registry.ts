/**
 * Bot 事件注册器 - 将 mineflayer bot 事件转换为统一的事件系统
 */

import type { Bot } from 'mineflayer';
import type { EventManager } from './event-manager.js';
import { EventSeverity } from './event-types.js';
import type { Vec3 } from 'vec3';

export class BotEventRegistry {
  constructor(
    private bot: Bot,
    private eventManager: EventManager
  ) { }

  /**
   * 注册所有 bot 事件
   */
  registerAllEvents(): void {
    this.registerConnectionEvents();
    this.registerChatEvents();
    this.registerEntityEvents();
    this.registerBlockEvents();
    this.registerItemEvents();
    this.registerDamageEvents();
    this.registerDeathEvents();
    this.registerMovementEvents();
    this.registerErrorEvents();
  }

  /**
   * 注册连接相关事件
   */
  private registerConnectionEvents(): void {
    this.bot.once('spawn', () => {
      this.eventManager.createAndEmit(
        'spawn',
        EventSeverity.SUCCESS,
        `机器人已生成在世界中`,
        {
          position: this.bot.entity?.position ? {
            x: Math.floor(this.bot.entity.position.x),
            y: Math.floor(this.bot.entity.position.y),
            z: Math.floor(this.bot.entity.position.z)
          } : undefined,
          username: this.bot.username
        }
      );
    });

    this.bot.on('login', () => {
      this.eventManager.createAndEmit(
        'login',
        EventSeverity.INFO,
        `机器人已登录服务器`,
        {
          username: this.bot.username,
        }
      );
    });

    this.bot.on('kicked', (reason) => {
      this.eventManager.createAndEmit(
        'kicked',
        EventSeverity.ERROR,
        `机器人被服务器踢出: ${this.formatError(reason)}`,
        {
          reason: this.formatError(reason),
          username: this.bot.username
        }
      );
    });

    this.bot.on('end', (reason) => {
      this.eventManager.createAndEmit(
        'end',
        EventSeverity.WARNING,
        `机器人连接已断开: ${this.formatError(reason)}`,
        {
          reason: this.formatError(reason)
        }
      );
    });
  }

  /**
   * 注册聊天事件
   */
  private registerChatEvents(): void {
    this.bot.on('chat', (username, message) => {
      if (username === this.bot.username) return;

      this.eventManager.createAndEmit(
        'chat',
        EventSeverity.INFO,
        `${username}: ${message}`,
        {
          username,
          message,
          isBot: false
        }
      );
    });

    this.bot.on('whisper', (username, message) => {
      this.eventManager.createAndEmit(
        'chat',
        EventSeverity.INFO,
        `[私聊] ${username}: ${message}`,
        {
          username,
          message,
          isBot: false,
          isWhisper: true
        }
      );
    });
  }

  /**
   * 注册实体事件
   */
  private registerEntityEvents(): void {
    this.bot.on('entityHurt', (entity) => {
      this.eventManager.createAndEmit(
        'entity_hurt',
        EventSeverity.INFO,
        `实体 ${entity.name || entity.type} 受到伤害`,
        {
          entityId: entity.id,
          entityType: entity.type,
          entityName: entity.name,
          position: entity.position ? {
            x: Math.floor(entity.position.x),
            y: Math.floor(entity.position.y),
            z: Math.floor(entity.position.z)
          } : undefined,
          health: (entity as any).health
        }
      );
    });

    this.bot.on('entityDead', (entity) => {
      this.eventManager.createAndEmit(
        'entity_death',
        EventSeverity.INFO,
        `实体 ${entity.name || entity.type} 死亡`,
        {
          entityId: entity.id,
          entityType: entity.type,
          entityName: entity.name,
          position: entity.position ? {
            x: Math.floor(entity.position.x),
            y: Math.floor(entity.position.y),
            z: Math.floor(entity.position.z)
          } : undefined
        }
      );
    });

    this.bot.on('entitySpawn', (entity) => {
      this.eventManager.createAndEmit(
        'entity_spawn',
        EventSeverity.INFO,
        `实体 ${entity.name || entity.type} 生成`,
        {
          entityId: entity.id,
          entityType: entity.type,
          entityName: entity.name,
          position: entity.position ? {
            x: Math.floor(entity.position.x),
            y: Math.floor(entity.position.y),
            z: Math.floor(entity.position.z)
          } : undefined
        }
      );
    });

    this.bot.on('entityGone', (entity) => {
      this.eventManager.createAndEmit(
        'entity_gone',
        EventSeverity.INFO,
        `实体 ${entity.name || entity.type} 消失`,
        {
          entityId: entity.id,
          entityType: entity.type,
          entityName: entity.name
        }
      );
    });
  }

  /**
   * 注册方块事件
   */
  private registerBlockEvents(): void {
    this.bot.on('blockUpdate', (oldBlock, newBlock) => {
      if (oldBlock && oldBlock.type !== newBlock.type) {
        this.eventManager.createAndEmit(
          'block_update',
          EventSeverity.INFO,
          `方块更新: ${oldBlock.name} -> ${newBlock.name}`,
          {
            position: {
              x: newBlock.position.x,
              y: newBlock.position.y,
              z: newBlock.position.z
            },
            blockType: newBlock.type,
            blockName: newBlock.name,
            oldBlockType: oldBlock.type
          }
        );
      }
    });

    this.bot.on('blockBreakProgressObserved', (block, destroyStage) => {
      if (destroyStage === 9) {
        this.eventManager.createAndEmit(
          'block_break',
          EventSeverity.INFO,
          `方块被破坏: ${block.name}`,
          {
            position: {
              x: block.position.x,
              y: block.position.y,
              z: block.position.z
            },
            blockType: block.type,
            blockName: block.name
          }
        );
      }
    });
  }

  /**
   * 注册物品事件
   */
  private registerItemEvents(): void {
    this.bot.on('itemDrop', (entity) => {
      this.eventManager.createAndEmit(
        'item_drop',
        EventSeverity.INFO,
        `物品掉落: ${entity.name}`,
        {
          itemName: entity.name,
          position: entity.position ? {
            x: Math.floor(entity.position.x),
            y: Math.floor(entity.position.y),
            z: Math.floor(entity.position.z)
          } : undefined
        }
      );
    });

    // itemCollect 事件可能不存在，使用条件检查
    if (typeof (this.bot as any).on === 'function') {
      try {
        (this.bot as any).on('itemCollect', (collector: any, item: any) => {
          const isBot = collector === this.bot.entity;
          this.eventManager.createAndEmit(
            'item_collect',
            EventSeverity.INFO,
            `${isBot ? '机器人' : '实体'} 收集物品: ${item.name}`,
            {
              itemName: item.name,
              itemType: item.type,
              isBot
            }
          );
        });
      } catch (e) {
        // 事件不存在，忽略
      }
    }

    this.bot.inventory.on('updateSlot', (slot, oldItem, newItem) => {
      if (oldItem?.name !== newItem?.name || oldItem?.count !== newItem?.count) {
        this.eventManager.createAndEmit(
          'inventory_update',
          EventSeverity.INFO,
          `物品栏更新: 槽位 ${slot}`,
          {
            slot,
            oldItem: oldItem ? { name: oldItem.name, count: oldItem.count } : null,
            newItem: newItem ? { name: newItem.name, count: newItem.count } : null
          }
        );
      }
    });
  }

  /**
   * 注册伤害事件
   */
  private registerDamageEvents(): void {
    this.bot.on('health', () => {
      const maxHealth = (this.bot as any).maxHealth || 20; // 默认最大生命值
      this.eventManager.createAndEmit(
        'health_change',
        EventSeverity.INFO,
        `生命值变化: ${this.bot.health}/${maxHealth}`,
        {
          health: this.bot.health,
          maxHealth: maxHealth
        }
      );
    });

    // hurt 事件可能不存在，使用条件检查
    try {
      (this.bot as any).on('hurt', () => {
        const maxHealth = (this.bot as any).maxHealth || 20;
        this.eventManager.createAndEmit(
          'damage',
          EventSeverity.WARNING,
          `机器人受到伤害: ${this.bot.health}/${maxHealth}`,
          {
            health: this.bot.health,
            maxHealth: maxHealth
          }
        );
      });
    } catch (e) {
      // 事件不存在，忽略
    }
  }

  /**
   * 注册死亡事件
   */
  private registerDeathEvents(): void {
    this.bot.on('death', () => {
      this.eventManager.createAndEmit(
        'death',
        EventSeverity.ERROR,
        `机器人死亡`,
        {
          position: this.bot.entity?.position ? {
            x: Math.floor(this.bot.entity.position.x),
            y: Math.floor(this.bot.entity.position.y),
            z: Math.floor(this.bot.entity.position.z)
          } : undefined
        }
      );
    });

    this.bot.on('respawn', () => {
      this.eventManager.createAndEmit(
        'respawn',
        EventSeverity.SUCCESS,
        `机器人重生`,
        {
          position: this.bot.entity?.position ? {
            x: Math.floor(this.bot.entity.position.x),
            y: Math.floor(this.bot.entity.position.y),
            z: Math.floor(this.bot.entity.position.z)
          } : undefined
        }
      );
    });
  }

  /**
   * 注册移动事件
   */
  private registerMovementEvents(): void {
    let lastPosition: Vec3 | null = null;
    let lastMoveTime = 0;

    this.bot.on('move', () => {
      const now = Date.now();
      // 限制移动事件频率，每 500ms 最多触发一次
      if (now - lastMoveTime < 500) return;
      lastMoveTime = now;

      const currentPos = this.bot.entity?.position;
      if (!currentPos) return;

      this.eventManager.createAndEmit(
        'move',
        EventSeverity.INFO,
        `机器人移动`,
        {
          position: {
            x: Math.floor(currentPos.x),
            y: Math.floor(currentPos.y),
            z: Math.floor(currentPos.z)
          },
          onGround: this.bot.entity?.onGround
        }
      );

      lastPosition = currentPos.clone();
    });

    // jump 事件可能不存在，使用条件检查
    try {
      (this.bot as any).on('jump', () => {
        this.eventManager.createAndEmit(
          'jump',
          EventSeverity.INFO,
          `机器人跳跃`,
          {
            position: this.bot.entity?.position ? {
              x: Math.floor(this.bot.entity.position.x),
              y: Math.floor(this.bot.entity.position.y),
              z: Math.floor(this.bot.entity.position.z)
            } : undefined
          }
        );
      });
    } catch (e) {
      // 事件不存在，忽略
    }
  }

  /**
   * 注册错误事件
   */
  private registerErrorEvents(): void {
    this.bot.on('error', (err) => {
      const errorCode = (err as { code?: string }).code || 'Unknown error';
      const errorMsg = err instanceof Error ? err.message : String(err);

      this.eventManager.createAndEmit(
        'error',
        EventSeverity.ERROR,
        `机器人错误 [${errorCode}]: ${errorMsg}`,
        {
          error: errorMsg,
          code: errorCode,
          stack: err instanceof Error ? err.stack : undefined
        }
      );
    });
  }

  /**
   * 格式化错误信息
   */
  private formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
