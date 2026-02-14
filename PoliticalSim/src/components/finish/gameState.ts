// クリア/ゲームオーバーの判定と初期化（Timeline から独立）
// Timeline 側から渡して使うスタイル

import type { PlayerStatus, PublicOpinion } from '../life/lifeEventsLogic';
import { TUNING } from '../config/tuning';

export type FinishFlags = { isGameOver: boolean; isCleared: boolean; };

export const DEFAULT_FLAGS: FinishFlags = { isGameOver: false, isCleared: false };

export function checkGameState(
  flags: FinishFlags,
  status: PlayerStatus,
  opinion: PublicOpinion,
  followers: number,
) {
  if (flags.isGameOver || flags.isCleared) return flags;

  // ゲームオーバー条件例
  if (opinion.apathetic >= TUNING.gameOver.apathetic || status.energy <= TUNING.gameOver.energy) {
    return { ...flags, isGameOver: true };
  }

  // クリア条件例（市議選挑戦可能ライン）
//   if (status.credibility >= 80 && status.comm >= 70 && followers >= 1000 && opinion.apathetic <= 40) { //本番用
    if (
        status.credibility >= TUNING.clear.credibility &&
        status.comm        >= TUNING.clear.comm &&
        followers          >= TUNING.clear.followers &&
        opinion.apathetic  <= TUNING.clear.apathetic
    ) {
        return { ...flags, isCleared: true };
    }

  return flags;
}