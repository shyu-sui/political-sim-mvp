// 架空政党データ（現実政党とは無関係）
import type { Party } from '../../types/gameTypes';

export const PARTIES: Party[] = [
  {
    id: 'rnp',
    name: '保守新生党',
    shortName: '保新',
    color: '#2563eb',
    ideology: '中道右派・伝統と改革の両立',
    beliefs: { economy: 65, welfare: 40, security: 70, environment: 45, foreign: 55, conservative: 70 },
    orgStrength: 75,
    funding:      80,
    factions: ['伝統派', '経済優先派', '安保強化派'],
    description: '伝統的価値観と市場経済を重視しつつ、穏健な改革を推進する中道右派政党。',
  },
  {
    id: 'sda',
    name: '社会民主連合',
    shortName: '社民連',
    color: '#dc2626',
    ideology: '中道左派・格差是正・福祉拡充',
    beliefs: { economy: 35, welfare: 75, security: 40, environment: 65, foreign: 70, conservative: 25 },
    orgStrength: 65,
    funding:      55,
    factions: ['労働組合系', '市民運動派', '環境左派'],
    description: '福祉国家の実現と格差縮小を掲げる中道左派政党。労働組合との連携が強い。',
  },
  {
    id: 'rip',
    name: '改革維新党',
    shortName: '改革維新',
    color: '#059669',
    ideology: '中道・規制改革・デジタル化推進',
    beliefs: { economy: 70, welfare: 50, security: 55, environment: 60, foreign: 65, conservative: 50 },
    orgStrength: 50,
    funding:      70,
    factions: ['テック系', '若手改革派', '地方分権派'],
    description: '既存の政治慣習を打破し、デジタル化と規制改革で経済成長を目指す新興政党。',
  },
  {
    id: 'gfp',
    name: '緑の党・未来',
    shortName: '緑未来',
    color: '#16a34a',
    ideology: '環境最優先・持続可能な社会',
    beliefs: { economy: 30, welfare: 65, security: 35, environment: 95, foreign: 75, conservative: 20 },
    orgStrength: 35,
    funding:      30,
    factions: ['環境科学派', '反核派', '動物権利派'],
    description: '環境保護と脱炭素を最重要課題とする小規模政党。若い世代に支持が厚い。',
  },
  {
    id: 'nff',
    name: '国民第一戦線',
    shortName: '国民戦線',
    color: '#7c3aed',
    ideology: '右派ナショナリスト・自国優先',
    beliefs: { economy: 55, welfare: 45, security: 85, environment: 25, foreign: 20, conservative: 85 },
    orgStrength: 45,
    funding:      40,
    factions: ['強硬派', '経済ナショナリスト', '反移民派'],
    description: '自国民の利益を最優先し、外交では強硬な姿勢をとる右派ナショナリスト政党。',
  },
];

export function getPartyById(id: string): Party | undefined {
  return PARTIES.find(p => p.id === id);
}
