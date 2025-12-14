import mineflayer from 'mineflayer';
import { ToolFactory } from '../tool-factory.js';

/**
 * 注册游戏状态工具
 * @param factory 工具工厂
 * @param getBot 获取机器人实例
 */
export function registerGameStateTools(factory: ToolFactory, getBot: () => mineflayer.Bot): void {

  /**
   * 检测游戏模式
   * @returns 游戏模式的结果
   */
  factory.registerTool(
    "detect-gamemode",
    "Detect the gamemode on game",
    {},
    async () => {
      const bot = getBot();
      return factory.createResponse(`Bot gamemode: "${bot.game.gameMode}"`);
    }
  );
}
