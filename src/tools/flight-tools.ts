import { z } from "zod";
import mineflayer from 'mineflayer';
import { Vec3 } from 'vec3';
import { ToolFactory } from '../tool-factory.js';

/**
 * 创建可取消的飞行操作
 * @param bot 机器人实例
 * @param destination 目标位置
 * @param controller 取消控制器
 * @returns 飞行操作的结果
 */
function createCancellableFlightOperation(
  bot: mineflayer.Bot,
  destination: Vec3,
  controller: AbortController
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let aborted = false;

    controller.signal.addEventListener('abort', () => {
      aborted = true;
      bot.creative.stopFlying();
      reject(new Error("Flight operation cancelled"));
    });

    bot.creative.flyTo(destination)
      .then(() => {
        if (!aborted) {
          resolve(true);
        }
      })
      .catch((err: Error) => {
        if (!aborted) {
          reject(err);
        }
      });
  });
}

/**
 * 注册飞行工具
 * @param factory 工具工厂
 * @param getBot 获取机器人实例
 */
export function registerFlightTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {
  
  /**
   * 飞行到指定位置
   * @param x 目标位置的X坐标
   * @param y 目标位置的Y坐标
   * @param z 目标位置的Z坐标
   * @returns 飞行到指定位置的结果
   */
  factory.registerTool(
    "fly-to",
    "Make the bot fly to a specific position",
    {
      x: z.number().describe("X coordinate"),
      y: z.number().describe("Y coordinate"),
      z: z.number().describe("Z coordinate")
    },
    async ({ x, y, z }) => {
      const bot = getBot();

      if (!bot.creative) {
        return factory.createResponse("Creative mode is not available. Cannot fly.");
      }

      const controller = new AbortController();
      const FLIGHT_TIMEOUT_MS = 20000;

      const timeoutId = setTimeout(() => {
        if (!controller.signal.aborted) {
          controller.abort();
        }
      }, FLIGHT_TIMEOUT_MS);

      try {
        const destination = new Vec3(x, y, z);
        await createCancellableFlightOperation(bot, destination, controller);
        return factory.createResponse(`Successfully flew to position (${x}, ${y}, ${z}).`);
      } catch (error) {
        if (controller.signal.aborted) {
          const currentPosAfterTimeout = bot.entity.position;
          return factory.createErrorResponse(
            `Flight timed out after ${FLIGHT_TIMEOUT_MS / 1000} seconds. The destination may be unreachable. ` +
            `Current position: (${Math.floor(currentPosAfterTimeout.x)}, ${Math.floor(currentPosAfterTimeout.y)}, ${Math.floor(currentPosAfterTimeout.z)})`
          );
        }
        throw error;
      } finally {
        clearTimeout(timeoutId);
        bot.creative.stopFlying();
      }
    }
  );
}
