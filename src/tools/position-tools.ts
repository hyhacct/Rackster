import { z } from "zod";
import mineflayer from 'mineflayer';
import pathfinderPkg from 'mineflayer-pathfinder';
const { goals } = pathfinderPkg;
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';

type Direction = 'forward' | 'back' | 'left' | 'right';

/**
 * 注册位置工具
 * @param factory 工具工厂
 * @param getBot 获取机器人实例
 */
export function registerPositionTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {

  /**
   * 获取当前位置
   * @returns 当前位置
   */
  factory.registerTool(
    "get-position",
    "Get the current position of the bot",
    {},
    async () => {
      const bot = getBot();
      const position = bot.entity.position;
      const pos = {
        x: Math.floor(position.x),
        y: Math.floor(position.y),
        z: Math.floor(position.z)
      };
      return factory.createResponse(`Current position: (${pos.x}, ${pos.y}, ${pos.z})`);
    }
  );

  /**
   * 移动到指定位置
   * @param x 目标位置的X坐标
   * @param y 目标位置的Y坐标
   * @param z 目标位置的Z坐标
   * @param range 到达目标位置的距离
   * @returns 移动到指定位置的结果
   */
  factory.registerTool(
    "move-to-position",
    "Move the bot to a specific position",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
      range: z.number().optional().describe("How close to get to the target (default: 1)")
    },
    async ({ x, y, z, range = 1 }) => {
      const bot = getBot();
      const goal = new goals.GoalNear(x, y, z, range);
      await bot.pathfinder.goto(goal);
      return factory.createResponse(`Successfully moved to position near (${x}, ${y}, ${z})`);
    }
  );

  /**
   * 看向指定位置
   * @param x 目标位置的X坐标
   * @param y 目标位置的Y坐标
   * @param z 目标位置的Z坐标
   * @returns 看向指定位置的结果
   */
  factory.registerTool(
    "look-at",
    "Make the bot look at a specific position",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate"),
    },
    async ({ x, y, z }) => {
      const bot = getBot();
      await bot.lookAt(new Vec3(x, y, z), true);
      return factory.createResponse(`Looking at position (${x}, ${y}, ${z})`);
    }
  );

  /**
   * 跳跃
   * @returns 跳跃的结果
   */
  factory.registerTool(
    "jump",
    "Make the bot jump",
    {},
    async () => {
      const bot = getBot();
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), 250);
      return factory.createResponse("Successfully jumped");
    }
  );

  /**
   * 在指定方向移动
   * @param direction 移动方向
   * @param duration 移动持续时间
   * @returns 在指定方向移动的结果
   */
  factory.registerTool(
    "move-in-direction",
    "Move the bot in a specific direction for a duration",
    {
      direction: z.enum(['forward', 'back', 'left', 'right']).describe("Direction to move"),
      duration: z.number().optional().describe("Duration in milliseconds (default: 1000)")
    },
    async ({ direction, duration = 1000 }: { direction: Direction, duration?: number }) => {
      const bot = getBot();
      return new Promise((resolve) => {
        bot.setControlState(direction, true);
        setTimeout(() => {
          bot.setControlState(direction, false);
          resolve(factory.createResponse(`Moved ${direction} for ${duration}ms`));
        }, duration);
      });
    }
  );
}
