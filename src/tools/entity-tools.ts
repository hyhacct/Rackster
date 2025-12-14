import { z } from "zod";
import type { Bot } from 'mineflayer';
import { ToolFactory } from '../tool-factory.js';

type Entity = ReturnType<Bot['nearestEntity']>;

/**
 * 注册实体工具
 * @param factory 工具工厂
 * @param getBot 获取机器人实例
 */
export function registerEntityTools(factory: ToolFactory, getBot: () => Bot): void {

  /**
   * 查找实体
   * @param type 实体类型
   * @param maxDistance 最大查找距离
   * @returns 查找实体的结果
   */
  factory.registerTool(
    "find-entity",
    "Find the nearest entity of a specific type",
    {
      type: z.string().optional().describe("Type of entity to find (empty for any entity)"),
      maxDistance: z.number().optional().describe("Maximum search distance (default: 16)")
    },
    async ({ type = '', maxDistance = 16 }) => {
      const bot = getBot();
      const entityFilter = (entity: NonNullable<Entity>) => {
        if (!type) return true;
        if (type === 'player') return entity.type === 'player';
        if (type === 'mob') return entity.type === 'mob';
        return Boolean(entity.name && entity.name.includes(type.toLowerCase()));
      };

      const entity = bot.nearestEntity(entityFilter);

      if (!entity || bot.entity.position.distanceTo(entity.position) > maxDistance) {
        return factory.createResponse(`No ${type || 'entity'} found within ${maxDistance} blocks`);
      }

      const entityName = entity.name || (entity as { username?: string }).username || entity.type;
      return factory.createResponse(`Found ${entityName} at position (${Math.floor(entity.position.x)}, ${Math.floor(entity.position.y)}, ${Math.floor(entity.position.z)})`);
    }
  );
}
