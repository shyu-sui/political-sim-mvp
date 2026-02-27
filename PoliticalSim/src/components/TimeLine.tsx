
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './timeline.css';
import { FiZap, FiUsers, FiTwitter, FiGlobe, FiBell } from 'react-icons/fi';

import { TUNING } from './config/tuning';

import {
  initialElectionState, announceElection, joinElection, leaveElection,
  openVoting, computeResult, type ElectionState
} from './election/electionLogic.ts';
import ElectionBanner from './election/ElectionBanner.tsx';
import ElectionCard from './election/ElectionCard';
import VotingAnimation from './election/VotingAnimation';
import CouncilEndModal from './council/CouncilEndModal';

import { rollLifeEvent } from './life/lifeEventsLogic';

import { checkGameState } from './finish/gameState';
import FinishBanner from './finish/FinishBanner';
import SettingsScreen from './settings/SettingsScreen';

import type { CharType } from './start/StartScreen';

// 新: 信念スコア・討論バトル・スキャンダル
import {
  defaultBeliefScore, computeApprovalRate, noScandal,
  type BeliefScore, type ScandalState, type ScandalChoice, type DebateState,
} from '../types/gameTypes';
import DebateBattle, { createDebateState } from './battle/DebateBattle';
import ScandalEvent, { createSecretaryScandal } from './scandal/ScandalEvent';

export type EventCategory = 'news' | 'sns' | 'friend' | 'action' | 'system';
export type Impact = 'good' | 'bad' | 'neutral';
export type TimelineEvent = {
  id: string;
  date: string;
  category: EventCategory;
  title: string;
  description?: string;
  impact: Impact;
  delta?: { cons?: number; lib?: number; apa?: number; followers?: number };
};

type Friend = {
  id: string;
  name: string;
  conservative: number;
  liberal: number;
  apathetic: number;
};

function randRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeInitialFriends(): Friend[] {
  return [
    { id: crypto.randomUUID(), name: '友人A', conservative: randRange(30, 70), liberal: randRange(30, 70), apathetic: randRange(20, 60) },
    { id: crypto.randomUUID(), name: '友人B', conservative: randRange(30, 70), liberal: randRange(30, 70), apathetic: randRange(20, 60) },
    { id: crypto.randomUUID(), name: '友人C', conservative: randRange(30, 70), liberal: randRange(30, 70), apathetic: randRange(20, 60) },
  ];
}

type PlayerStatus = { comm: number; credibility: number; energy: number; };
type PublicOpinion = { conservative: number; liberal: number; apathetic: number; };
type NewsSpec = { title: string; desc: string; effect: Partial<PublicOpinion> };

type Filter = 'all' | EventCategory;
const FILTER_OPTIONS = ['all', 'news', 'sns', 'friend', 'action', 'system'] as const;

const initialEvents: TimelineEvent[] = [
  {
    id: crypto.randomUUID(),
    date: 'Day 1',
    category: 'system',
    title: '選挙まで1ヶ月。あなたの行動が世論を動かします。',
    description: '行動を選んでみましょう。',
    impact: 'neutral',
  },
];

const categoryMeta: Record<
  EventCategory,
  { label: string; color: string; Icon: React.ComponentType<{ size?: number }> }
> = {
  news:   { label: 'ニュース', color: '#2b6cb0', Icon: FiGlobe },
  sns:    { label: 'SNS',      color: '#1da1f2', Icon: FiTwitter },
  friend: { label: '友人',     color: '#805ad5', Icon: FiUsers },
  action: { label: '行動',     color: '#2f855a', Icon: FiZap },
  system: { label: 'システム', color: '#718096', Icon: FiBell },
};

const impactLabel: Record<Impact, string> = { good: '好影響', bad: '悪影響', neutral: '中立' };
const impactColor: Record<Impact, string> = { good: '#38a169', bad: '#e53e3e', neutral: '#718096' };

function getInitialStats(charType: CharType): { status: PlayerStatus; followerBonus: number } {
  switch (charType) {
    case 'activist':    return { status: { comm: 70, credibility: 50, energy: 80 }, followerBonus: 0 };
    case 'bureaucrat':  return { status: { comm: 50, credibility: 70, energy: 80 }, followerBonus: 0 };
    case 'entrepreneur':return { status: { comm: 50, credibility: 50, energy: 80 }, followerBonus: 200 };
    default:            return { status: { comm: 50, credibility: 50, energy: 80 }, followerBonus: 0 };
  }
}

interface TimelineProps {
  initialConfig: { playerName: string; charType: CharType; belief?: BeliefScore } | null;
  onReturnToStart: () => void;
}

export default function Timeline({ initialConfig, onReturnToStart }: TimelineProps) {
  const [events, setEvents]   = useState<TimelineEvent[]>(initialEvents);
  const [friends, setFriends] = useState<Friend[]>(makeInitialFriends());
  const [followers, setFollowers] = useState<number>(randRange(80, 150));
  const [playerName, setPlayerName] = useState<string>('');
  const [charType, setCharType]     = useState<CharType>('activist');

  const [status, setStatus] = useState<PlayerStatus>({ comm: 50, credibility: 50, energy: 80 });
  const [opinion, setOpinion] = useState<PublicOpinion>({ conservative: 70, liberal: 70, apathetic: 60 });
  const [filter, setFilter]   = useState<Filter>('all');
  const [election, setElection] = useState<ElectionState>(initialElectionState());

  // ---- 新: 信念スコア・支持率 ----
  const [beliefScore, setBeliefScore] = useState<BeliefScore>(defaultBeliefScore());

  // 支持率: opinion + 信念一貫性から計算
  const approvalRate = useMemo(() =>
    computeApprovalRate({
      conservative: opinion.conservative,
      liberal:      opinion.liberal,
      apathetic:    opinion.apathetic,
      consistency:  beliefScore.consistency,
    }),
    [opinion, beliefScore.consistency]
  );

  // ---- 新: スキャンダル・討論バトル ----
  const [activeScandal, setActiveScandal] = useState<ScandalState>(noScandal());
  const [activeDebate,  setActiveDebate]  = useState<DebateState | null>(null);
  const [scandalTriggered, setScandalTriggered] = useState(false);

  // ---- 市議挑戦フェーズ: 街頭演説+討論の累計回数・SNSサブメニュー ----
  const [speechDebateCount, setSpeechDebateCount] = useState(0);
  const [showSnsMenu, setShowSnsMenu] = useState(false);

  // ---- 市議当選後フェーズ ----
  const [isCouncilor, setIsCouncilor]             = useState(false);
  const [councilTurn, setCouncilTurn]             = useState(0);
  const [showCouncilEndModal, setShowCouncilEndModal] = useState(false);

  // ---- 投票アニメーション ----
  type PendingVote = {
    playerShare: number; rivalShare: number;
    turnout: number; won: boolean;
    finalState: ElectionState;
    type: 'city' | 'house';
    rivalName: string;
  };
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);

  const filtered = useMemo(
    () => (filter === 'all' ? events : events.filter(e => e.category === filter)),
    [events, filter]
  );

  const handleFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
    setFilter(e.currentTarget.value as Filter);
  };

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const [day, setDay]   = useState<number>(1);
  const [ap, setAp]     = useState<number>(3);
  const [month, setMonth] = useState<number>(1);
  const [year, setYear]   = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCleared,  setIsCleared]  = useState(false);

  const fmt0 = (n: number) => Math.floor(n).toString();

  // ---------- スキャンダル結果ハンドラ ----------
  function handleScandalClose(choice: ScandalChoice) {
    const { approvalDelta, consistencyDelta, credibilityDelta } = choice.outcome;
    // 一貫性スコアへ反映
    setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency + consistencyDelta, 0, 100) }));
    // 世論・ステータスへ反映（approvalDelta → apathetic の逆方向へ）
    setOpinion(o => ({
      ...o,
      conservative: clamp(o.conservative + approvalDelta * 0.3, 0, 100),
      liberal:      clamp(o.liberal      + approvalDelta * 0.3, 0, 100),
      apathetic:    clamp(o.apathetic    - approvalDelta * 0.2, 0, 100),
    }));
    setStatus(s => ({ ...s, credibility: clamp(s.credibility + credibilityDelta, 0, 100) }));
    setActiveScandal(noScandal());

    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'system',
      title: `スキャンダル対応：${choice.label}`,
      description: choice.outcome.message,
      impact: choice.outcome.success ? 'good' : 'bad',
    }, ...prev]);
  }

  // ---------- 討論バトル結果ハンドラ ----------
  function handleDebateClose(res: { result: 'win' | 'lose'; consistencyDelta: number }) {
    const won = res.result === 'win';
    setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency + res.consistencyDelta, 0, 100) }));
    setOpinion(o => ({
      conservative: clamp(o.conservative + (won ? +3 : -3), 0, 100),
      liberal:      clamp(o.liberal      + (won ? +3 : -3), 0, 100),
      apathetic:    clamp(o.apathetic    + (won ? -4 : +4), 0, 100),
    }));
    setStatus(s => ({
      ...s,
      credibility: clamp(s.credibility + (won ? +8 : -5), 0, 100),
      comm:        clamp(s.comm        + (won ? +5 : -2), 0, 100),
    }));
    if (won) setFollowers(n => n + 200);
    setActiveDebate(null);
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'action',
      title: `討論バトル：${won ? '勝利！' : '敗北…'}`,
      description: won
        ? '鋭い論法で相手を圧倒。支持者が増加し、信頼が高まりました。'
        : '議論で押し切られました。次回に備えて信念を整理しましょう。',
      impact: won ? 'good' : 'bad',
      delta: { followers: won ? 200 : 0 },
    }, ...prev]);
    setAp(x => Math.max(0, x - 2)); // 討論は AP 2 消費
  }

  // ---------- 討論開始（市議挑戦フェーズ以降のみ解放） ----------
  function startDebate() {
    if (ap < 2 || isGameOver || !isCleared) return;
    const debate = createDebateState({
      opponentName:  '田中 保一',
      opponentParty: '守旧派連合',
      topic:         'アルメリアの経済政策をめぐる討論',
      opponentHP:    80,
    });
    setActiveDebate(debate);
    setSpeechDebateCount(c => c + 1);
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'action',
      title: '討論バトルに参加した', description: '田中 保一 と経済政策について激論を交わしています。',
      impact: 'neutral',
    }, ...prev]);
  }

  // ---------- nextDay ----------
  const nextDay = () => {
    if (ap > 0) return;

    const drift = () => (Math.random() < 0.5 ? -1 : 1);
    setOpinion(o => ({
      conservative: clamp(o.conservative + drift(), 0, 100),
      liberal:      clamp(o.liberal      + drift(), 0, 100),
      apathetic:    clamp(o.apathetic    + drift(), 0, 100),
    }));

    const spec = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
    if (Math.random() <= 0.9) {
      setOpinion(o => ({
        conservative: clamp(o.conservative + (spec.effect.conservative ?? 0), 0, 100),
        liberal:      clamp(o.liberal      + (spec.effect.liberal ?? 0),      0, 100),
        apathetic:    clamp(o.apathetic    + (spec.effect.apathetic ?? 0),    0, 100),
      }));
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `Day ${day + 1}`, category: 'news',
        title: spec.title, description: spec.desc, impact: 'neutral',
        delta: {
          cons: spec.effect.conservative !== undefined ? Number(spec.effect.conservative.toFixed(1)) : undefined,
          lib:  spec.effect.liberal      !== undefined ? Number(spec.effect.liberal.toFixed(1))      : undefined,
          apa:  spec.effect.apathetic    !== undefined ? Number(spec.effect.apathetic.toFixed(1))    : undefined,
        },
      }, ...prev]);
    }

    const next = day + 1;
    const isMonthEnd = next > TUNING.dayPerMonth;
    if (isMonthEnd) {
      setElection(prev => announceElection(prev, month, year));
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `Month ${month}, Year ${year}`, category: 'system',
        title: '選挙が公示されました（参加可能）',
        description: '上部のバナー、またはこのカードから参加／投票へ移動できます。',
        impact: 'neutral',
      }, ...prev]);
      setDay(1);
      setMonth(m => {
        const newMonth = m === 12 ? 1 : m + 1;
        if (m === 12) setYear(y => y + 1);
        return newMonth;
      });
    } else {
      setDay(next);
    }

    setEvents(prev => [{
      id: crypto.randomUUID(),
      date: isMonthEnd ? `Day 1 / Month ${month === 12 ? 1 : month + 1}` : `Day ${day + 1}`,
      category: 'system', title: '新しい一日が始まりました',
      description: '世論が日々の話題でわずかに揺れています。', impact: 'neutral',
    }, ...prev]);

    // 市議挑戦フェーズ: 一貫性が低いほどスキャンダルが発生しやすい
    if (isCleared && !isGameOver && !activeScandal.active) {
      const scandalProb = (100 - beliefScore.consistency) / 400; // 最大25%/日
      if (Math.random() < scandalProb) {
        setActiveScandal(createSecretaryScandal());
      }
    }

    if (!isGameOver && !isCleared) {
      if (Math.random() <= TUNING.lifeEventProb) {
        const res = rollLifeEvent(status, opinion);
        setStatus(s => ({ ...s, ...res.status }));
        setOpinion(o => ({
          conservative: clamp(res.opinion.conservative ?? o.conservative, 0, 100),
          liberal:      clamp(res.opinion.liberal      ?? o.liberal,      0, 100),
          apathetic:    clamp(res.opinion.apathetic    ?? o.apathetic,    0, 100),
        }));
        setEvents(prev => [{
          id: crypto.randomUUID(), date: `Day ${day + 1}`, category: 'system',
          title: res.title, description: res.desc, impact: res.impact, delta: res.delta,
        }, ...prev]);
      }

      const flags = checkGameState({ isGameOver, isCleared }, status, opinion, followers);
      if (flags.isGameOver && !isGameOver) {
        setIsGameOver(true);
        setEvents(prev => [{
          id: crypto.randomUUID(), date: `Day ${day + 1}`, category: 'system',
          title: 'ゲームオーバー', description: '条件を満たせず活動終了…。', impact: 'bad',
        }, ...prev]);
      } else if (flags.isCleared && !isCleared) {
        setIsCleared(true);
        setEvents(prev => [{
          id: crypto.randomUUID(), date: `Day ${day + 1}`, category: 'system',
          title: 'ゲームクリア！', description: '市議選への挑戦条件を満たしました。', impact: 'good',
        }, ...prev]);
      }
    }

    setAp(TUNING.apPerDay);
  };

  // 選挙ハンドラ
  const handleElectionJoin  = () => setElection(prev => joinElection(prev));
  const handleElectionLeave = () => setElection(prev => leaveElection(prev));
  // Phase 2: 市議選へ立候補する（新規選挙を公示 + 参加を同時に実行）
  const handleGoToCityElection = () => {
    const announced = announceElection(initialElectionState(), month, year);
    setElection(joinElection(announced));
  };

  // 投票ボタン：結果を計算してアニメーションを表示
  const handleElectionVote = () => {
    const withVoting = openVoting(election);
    const finalState = computeResult(withVoting, {
      conservative: opinion.conservative,
      liberal:      opinion.liberal,
      apathetic:    opinion.apathetic,
      credibility:  status.credibility,
      comm:         status.comm,
      followers,
      consistency:  beliefScore.consistency,
    });
    if (!finalState.lastResult) return;
    const { voteShare, rivalShare, turnout, won } = finalState.lastResult;
    setPendingVote({
      playerShare: voteShare, rivalShare, turnout, won, finalState,
      type: 'city', rivalName: '田中 保一',
    });
  };

  // アニメーション終了後に結果を反映
  const handleVotingAnimClose = () => {
    if (!pendingVote) return;
    const { won, turnout, playerShare, type } = pendingVote;
    setOpinion(o => ({
      conservative: clamp(o.conservative + (won ? +1 : -1), 0, 100),
      liberal:      clamp(o.liberal      + (won ? +1 : -1), 0, 100),
      apathetic:    clamp(o.apathetic    + (won ? -2 : +2), 0, 100),
    }));

    const electionLabel = type === 'house' ? '衆議院議員選挙' : '市議会議員選挙';
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Month ${month}, Year ${year}`, category: 'system',
      title: `${electionLabel}結果：${won ? '当選！' : '惜敗…'}`,
      description: `投票率 ${turnout}% / 得票率 ${playerShare}%`,
      impact: won ? 'good' : 'bad',
      delta: { cons: won ? +1 : -1, lib: won ? +1 : -1, apa: won ? -2 : +2 },
    }, ...prev]);

    if (type === 'city') {
      if (won) {
        setIsCouncilor(true);
        setCouncilTurn(0);
      }
      // 当選・落選どちらでも選挙状態をリセット（落選時は FinishBanner から再挑戦できる）
      setElection(initialElectionState());
    } else {
      // 衆院選は結果をバナーに残す
      setElection(pendingVote.finalState);
    }
    setPendingVote(null);
  };

  // ---------- Phase3: 市議会 次の期へ（4ヶ月進行）----------
  function nextCouncilPeriod() {
    if (ap > 0 || isGameOver) return;

    const newTurn = councilTurn + 1;
    // 4ヶ月進める
    let newMonth = month + 4;
    let addYears = 0;
    while (newMonth > 12) { newMonth -= 12; addYears++; }
    setMonth(newMonth);
    if (addYears > 0) setYear(y => y + addYears);

    // 世論の自然変動
    setOpinion(o => ({
      conservative: clamp(o.conservative + (Math.random() * 6 - 3), 0, 100),
      liberal:      clamp(o.liberal      + (Math.random() * 6 - 3), 0, 100),
      apathetic:    clamp(o.apathetic    + (Math.random() * 4 - 2), 0, 100),
    }));

    setCouncilTurn(newTurn);
    const remaining = 12 - newTurn;
    setEvents(prev => [{
      id: crypto.randomUUID(),
      date: `Y${year + addYears}-M${newMonth}`,
      category: 'system',
      title: `市議会 第${newTurn}期（4ヶ月）が経過`,
      description: remaining > 0
        ? `残り ${remaining} 期（${remaining * 4} ヶ月）`
        : '4年間の市議会議員任期が終了しました。次のステップへ。',
      impact: 'neutral',
    }, ...prev]);

    if (newTurn >= 12) {
      setShowCouncilEndModal(true);
    }
    setAp(TUNING.apPerDay);
  }

  // ---------- 市議会終了：再挑戦 or 衆議院 ----------
  function handleReCityCouncil() {
    setIsCouncilor(false);
    setCouncilTurn(0);
    setShowCouncilEndModal(false);
    // 選挙を即公示状態にして再挑戦できるようにする
    setElection({ ...initialElectionState(), phase: 'announced', month, year });
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Y${year}-M${month}`, category: 'system',
      title: '市議選再挑戦を決意',
      description: '再び市議会議員選挙に立候補することを決めました。',
      impact: 'good',
    }, ...prev]);
  }

  function handleHouseElection() {
    setShowCouncilEndModal(false);
    // 衆議院選挙（threshold 55% で難易度高め）
    const withVoting = openVoting({ ...initialElectionState(), phase: 'voting', month, year });
    const finalState = computeResult(withVoting, {
      conservative: opinion.conservative,
      liberal:      opinion.liberal,
      apathetic:    opinion.apathetic,
      credibility:  status.credibility,
      comm:         status.comm,
      followers,
      consistency:  beliefScore.consistency,
    }, 55); // 衆議院は55%が当選ライン
    if (!finalState.lastResult) return;
    const { voteShare, rivalShare, turnout, won } = finalState.lastResult;
    setPendingVote({
      playerShare: voteShare, rivalShare, turnout, won,
      finalState,
      type: 'house',
      rivalName: '山田 太郎（現職議員）',
    });
  }

  function resetAll() {
    localStorage.removeItem(SAVE_KEY);
    onReturnToStart();
  }

  // NEWS
  const NEWS_POOL: NewsSpec[] = [
    { title: '経済指標が改善',    desc: '市況がやや持ち直しムード。',           effect: { conservative: +0.5, liberal: +0.5, apathetic: -0.5 } },
    { title: '物価高の懸念強まる', desc: '生活実感と政府評価にギャップ。',       effect: { conservative: -0.5, liberal: +0.5, apathetic: +0.5 } },
    { title: '災害対応が迅速',     desc: '政府への信頼がわずかに上向く。',       effect: { conservative: +0.8, liberal: +0.3, apathetic: -0.6 } },
    { title: '外交会談が難航',     desc: '国際関係の先行きに不安。',             effect: { conservative: -0.6, liberal: -0.6, apathetic: +0.6 } },
  ];

  function maybePushNews(prob = TUNING.newsDailyProb) {
    if (Math.random() > prob) return;
    const spec = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
    setOpinion(o => ({
      conservative: clamp(o.conservative + (spec.effect.conservative ?? 0), 0, 100),
      liberal:      clamp(o.liberal      + (spec.effect.liberal ?? 0),      0, 100),
      apathetic:    clamp(o.apathetic    + (spec.effect.apathetic ?? 0),    0, 100),
    }));
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'news',
      title: spec.title, description: spec.desc, impact: 'neutral',
      delta: {
        cons: spec.effect.conservative !== undefined ? Number(spec.effect.conservative.toFixed(1)) : undefined,
        lib:  spec.effect.liberal      !== undefined ? Number(spec.effect.liberal.toFixed(1))      : undefined,
        apa:  spec.effect.apathetic    !== undefined ? Number(spec.effect.apathetic.toFixed(1))    : undefined,
      },
    }, ...prev]);
  }

  const addActionEvent = (type: 'speech' | 'talk' | 'post' | 'policy') => {
    const date = `Day ${day}`;
    if (type === 'speech') {
      const deltaApa   = isCouncilor ? -5 : -4;
      const credDelta  = isCouncilor ?  5 :  3;
      const consDelta  = isCouncilor ?  2 :  1;
      setStatus(s => ({ ...s, credibility: Math.min(100, s.credibility + credDelta), energy: Math.max(0, s.energy - 4) }));
      setOpinion(o => ({ ...o, apathetic: Math.max(0, o.apathetic + deltaApa) }));
      setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency + consDelta, 0, 100) }));
      if (isCleared || isCouncilor) setSpeechDebateCount(c => c + 1);
      setEvents(prev => [{
        id: crypto.randomUUID(), date, category: 'action',
        title: isCouncilor ? '街頭演説をした' : isCleared ? '街頭演説を行った' : '街頭演説を聴いた',
        description: isCouncilor
          ? '市議として有権者に政策を訴えた。支持と一貫性が高まった。'
          : isCleared
            ? '有権者に直接訴えた。現場の声が一貫性と信頼を高める。'
            : '候補者の訴えに耳を傾け、政治への関心が高まった。',
        impact: 'good', delta: { apa: deltaApa },
      }, ...prev]);
      maybePushNews();
      setAp(x => Math.max(0, x - 1));
    } else if (type === 'policy') {
      const deltaApa = -3;
      setStatus(s => ({ ...s, credibility: Math.min(100, s.credibility + 4), energy: Math.max(0, s.energy - 6) }));
      setOpinion(o => ({ ...o, apathetic: Math.max(0, o.apathetic + deltaApa) }));
      setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency + 3, 0, 100) }));
      setFollowers(n => n + randRange(20, 50));
      setEvents(prev => [{
        id: crypto.randomUUID(), date, category: 'action',
        title: '政策立案を行った',
        description: '市民のための政策を練り上げた。信頼と一貫性が高まり、注目度も上昇。',
        impact: 'good', delta: { apa: deltaApa },
      }, ...prev]);
      maybePushNews();
      setAp(x => Math.max(0, x - 1));
    } else if (type === 'talk') {
      const target = friends[0] ?? friends[Math.floor(Math.random() * friends.length)];
      if (!target) return;
      const swing = () => (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.7 ? 1 : 2);
      const deltaCons = swing();
      const deltaLib  = swing();
      const deltaApa  = -1;
      const updated = {
        ...target,
        conservative: Math.max(0, Math.min(100, target.conservative + deltaCons)),
        liberal:      Math.max(0, Math.min(100, target.liberal + deltaLib)),
        apathetic:    Math.max(0, Math.min(100, target.apathetic + deltaApa)),
      };
      setFriends(prev => prev.map(f => f.id === target.id ? updated : f));
      const spread = 0.2;
      setOpinion(o => ({
        conservative: Math.max(0, Math.min(100, o.conservative + spread * deltaCons)),
        liberal:      Math.max(0, Math.min(100, o.liberal      + spread * deltaLib)),
        apathetic:    Math.max(0, Math.min(100, o.apathetic    + spread * deltaApa)),
      }));
      setStatus(s => ({ ...s, comm: Math.min(100, s.comm + 3), energy: Math.max(0, s.energy - 3) }));
      setEvents(prev => [{
        id: crypto.randomUUID(), date, category: 'friend',
        title: '友達と話した',
        description: '友達の政治傾向が少し変化。世論にも微細な波紋。',
        impact: 'neutral', delta: { cons: deltaCons, lib: deltaLib, apa: deltaApa },
      }, ...prev]);
      maybePushNews();
      setAp(x => Math.max(0, x - 1));
    } else {
      const bad = Math.random() < TUNING.rageRate.normal;
      const deltaFollowers = bad
        ? -(5 + Math.floor(Math.random() * 26))
        :  (10 + Math.floor(Math.random() * 31));
      setFollowers(n => Math.max(0, n + deltaFollowers));
      const influenceMul = Math.min(TUNING.snsInfluenceCap, 1.0 + followers * TUNING.snsInfluenceCoeff);
      setOpinion(o => ({
        conservative: Math.max(0, Math.min(100, o.conservative + (bad ? 0.5 : 0)   * influenceMul)),
        liberal:      Math.max(0, Math.min(100, o.liberal      + (bad ? -0.5 : 1) * influenceMul)),
        apathetic:    Math.max(0, Math.min(100, o.apathetic    + (bad ? 1 : -0.5) * influenceMul)),
      }));
      setStatus(s => ({
        ...s,
        comm:        Math.min(100, s.comm + (bad ? -2 : 2)),
        credibility: Math.min(100, Math.max(0, s.credibility + (bad ? -4 : 1))),
        energy:      Math.max(0, s.energy - 2),
      }));
      // 炎上は一貫性ダメージ
      if (bad) setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency - 3, 0, 100) }));
      setEvents(prev => [{
        id: crypto.randomUUID(), date, category: 'sns',
        title: 'SNSに投稿した',
        description: bad
          ? '炎上。フォロワーが減少し、信頼低下・関心後退。'
          : '反響あり。フォロワーが増加し、関心が少し高まった。',
        impact: bad ? 'bad' : 'good', delta: { followers: deltaFollowers },
      }, ...prev]);
      maybePushNews();
      setAp(x => Math.max(0, x - 1));
    }
  };

  // ---------- 市議挑戦フェーズ: SNS投稿（YouTube / X）----------
  function addSnsPostAdvanced(platform: 'youtube' | 'x') {
    setShowSnsMenu(false);
    const date = `Day ${day}`;
    const insufficient = speechDebateCount < 5;
    const isYouTube = platform === 'youtube';

    const rageRate  = isYouTube ? 0.10 : 0.20;
    const bad       = Math.random() < rageRate;
    const gainMin   = isYouTube ? 30 : 15;
    const gainMax   = isYouTube ? 80 : 50;
    const lossMin   = isYouTube ? 10 : 15;
    const lossMax   = isYouTube ? 30 : 40;
    const deltaFollowers = bad
      ? -(lossMin + Math.floor(Math.random() * (lossMax - lossMin + 1)))
      :  (gainMin + Math.floor(Math.random() * (gainMax - gainMin + 1)));

    setFollowers(n => Math.max(0, n + deltaFollowers));

    const credDelta = bad ? (isYouTube ? -3 : -5) : (insufficient ? 0 : (isYouTube ? 2 : 1));
    setStatus(s => ({
      ...s,
      credibility: clamp(s.credibility + credDelta, 0, 100),
      energy: Math.max(0, s.energy - (isYouTube ? 3 : 2)),
    }));

    if (insufficient && !bad) {
      // 実績不足ペナルティ: 支持率（保守・リベラル低下）+ 一貫性低下
      const opinionPenalty = isYouTube ? 3 : 5;
      const consistencyPenalty = isYouTube ? 5 : 8;
      setOpinion(o => ({
        conservative: clamp(o.conservative - opinionPenalty, 0, 100),
        liberal:      clamp(o.liberal      - opinionPenalty, 0, 100),
        apathetic:    clamp(o.apathetic    + opinionPenalty, 0, 100),
      }));
      setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency - consistencyPenalty, 0, 100) }));
    } else if (bad) {
      setBeliefScore(b => ({ ...b, consistency: clamp(b.consistency - 3, 0, 100) }));
    }

    const warningYT = '【忠告】街頭演説・討論の実績不足が動画の薄さとして露呈しました。支持率と一貫性が低下。まず現場経験を積んでから発信しましょう。';
    const warningX  = '【忠告】街頭演説・討論の実績不足で発言の根拠が薄いと指摘されました。支持率と一貫性が低下。まず現場での活動実績を作りましょう。';

    const description = bad
      ? (isYouTube ? '動画が批判を受けフォロワーが減少しました。' : '投稿が炎上。フォロワーが大幅に減少し、信頼が低下しました。')
      : insufficient
        ? (isYouTube ? warningYT : warningX)
        : (isYouTube ? '動画が好評でフォロワーと信頼が増加しました。' : '投稿が拡散されフォロワーが増加しました。');

    setEvents(prev => [{
      id: crypto.randomUUID(), date, category: 'sns',
      title: isYouTube ? 'YouTubeに動画を投稿した' : 'Xに投稿した',
      description,
      impact: (bad || insufficient) ? 'bad' : 'good',
      delta: { followers: deltaFollowers },
    }, ...prev]);

    maybePushNews();
    setAp(x => Math.max(0, x - 1));
  }

  // ---------- セーブ/ロード ----------
  type SaveState = {
    events: TimelineEvent[]; friends: Friend[]; followers: number;
    status: PlayerStatus; opinion: PublicOpinion; filter: Filter;
    day: number; month: number; year: number; ap: number;
    election: ElectionState; isGameOver: boolean; isCleared: boolean;
    playerName: string; charType: CharType;
    beliefScore: BeliefScore; scandalTriggered: boolean;
    speechDebateCount: number;
    isCouncilor: boolean; councilTurn: number;
  };
  const SAVE_KEY = 'politics-sim-save-v5';

  function saveGame() {
    const data: SaveState = {
      events, friends, followers, status, opinion, filter,
      day, month, year, ap, election, isGameOver, isCleared,
      playerName, charType, beliefScore, scandalTriggered,
      speechDebateCount, isCouncilor, councilTurn,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as SaveState;
      setEvents(d.events); setFriends(d.friends); setFollowers(d.followers);
      setStatus(d.status); setOpinion(d.opinion); setFilter(d.filter);
      setDay(d.day); setMonth(d.month); setYear(d.year); setAp(d.ap);
      setElection(d.election); setIsGameOver(d.isGameOver); setIsCleared(d.isCleared);
      if (d.playerName)  setPlayerName(d.playerName);
      if (d.charType)    setCharType(d.charType);
      if (d.beliefScore) setBeliefScore(d.beliefScore);
      if (d.scandalTriggered  !== undefined) setScandalTriggered(d.scandalTriggered);
      if (d.speechDebateCount !== undefined) setSpeechDebateCount(d.speechDebateCount);
      if (d.isCouncilor   !== undefined) setIsCouncilor(d.isCouncilor);
      if (d.councilTurn   !== undefined) setCouncilTurn(d.councilTurn);
    } catch {}
  }

  React.useEffect(() => { saveGame(); }, [
    events, status, opinion, followers, day, month, year, ap,
    election, isGameOver, isCleared, beliefScore, scandalTriggered,
    speechDebateCount, isCouncilor, councilTurn,
  ]);

  React.useEffect(() => {
    if (initialConfig !== null) {
      const { status: initStatus, followerBonus } = getInitialStats(initialConfig.charType);
      setPlayerName(initialConfig.playerName);
      setCharType(initialConfig.charType);
      setStatus(initStatus);
      setFollowers(randRange(80, 150) + followerBonus);
      if (initialConfig.belief) setBeliefScore(initialConfig.belief);
    } else {
      loadGame();
    }
  }, []);

  // ---------- 設定モーダル ----------
  const [showSettings, setShowSettings] = useState(false);

  // ---------- 信念スコア表示用ヘルパ ----------
  const beliefAxes: [string, keyof BeliefScore][] = [
    ['経済', 'economy'], ['福祉', 'welfare'], ['安保', 'security'],
    ['環境', 'environment'], ['外交', 'foreign'],
  ];

  // ---------- 選挙バナー自動スクロール ----------
  const electionBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (election.phase === 'announced' && electionBannerRef.current) {
      electionBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [election.phase]);

  if (showSettings) {
    return (
      <SettingsScreen
        onSave={() => { saveGame(); setShowSettings(false); }}
        onLoad={() => { loadGame(); setShowSettings(false); }}
        onReset={resetAll}
        onBack={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="tl-container">
      {/* ---- 市議会任期終了モーダル ---- */}
      {showCouncilEndModal && (
        <CouncilEndModal
          onReCityCouncil={handleReCityCouncil}
          onHouseElection={handleHouseElection}
        />
      )}

      {/* ---- 投票アニメーションモーダル ---- */}
      {pendingVote && (
        <VotingAnimation
          playerName={playerName || 'あなた'}
          playerShare={pendingVote.playerShare}
          rivalName={pendingVote.rivalName}
          rivalShare={pendingVote.rivalShare}
          turnout={pendingVote.turnout}
          won={pendingVote.won}
          onClose={handleVotingAnimClose}
        />
      )}

      {/* ---- スキャンダルモーダル ---- */}
      {activeScandal.active && (
        <ScandalEvent state={activeScandal} onClose={handleScandalClose} />
      )}

      {/* ---- 討論バトルモーダル ---- */}
      {activeDebate?.active && (
        <DebateBattle state={activeDebate} onClose={handleDebateClose} />
      )}

      {/* ステータスバー（行1: プレイヤー基本情報） */}
      <div className="tl-statusbar">
        {playerName && (
          <div className="tl-playername">
            <span>👤</span><strong>{playerName}</strong>
          </div>
        )}
        {playerName && <div className="tl-divider" />}
        <div className="tl-stat"><span>コミュ力</span><strong>{fmt0(status.comm)}</strong></div>
        <div className="tl-stat"><span>信頼</span><strong>{fmt0(status.credibility)}</strong></div>
        <div className="tl-stat"><span>体力</span><strong>{fmt0(status.energy)}</strong></div>
        <div className="tl-divider" />
        <div className="tl-stat"><span>保守</span><strong>{fmt0(opinion.conservative)}</strong></div>
        <div className="tl-stat"><span>リベラル</span><strong>{fmt0(opinion.liberal)}</strong></div>
        <div className="tl-stat"><span>無関心</span><strong>{fmt0(opinion.apathetic)}</strong></div>
        <div className="tl-divider" />
        <div className="tl-stat"><span>Day</span><strong>{fmt0(day)}</strong></div>
        <div className="tl-stat"><span>AP</span><strong>{fmt0(ap)}</strong></div>
      </div>

      {/* ステータスバー行2: 支持率・信念スコア */}
      <div className="tl-statusbar tl-statusbar2">
        <div className="tl-stat tl-approval">
          <span>支持率</span>
          <strong style={{ color: approvalRate >= 50 ? '#22c55e' : approvalRate >= 30 ? '#f59e0b' : '#ef4444' }}>
            {fmt0(approvalRate)}%
          </strong>
        </div>
        <div className="tl-divider" />
        <div className="tl-stat">
          <span>一貫性</span>
          <strong style={{ color: beliefScore.consistency >= 60 ? '#22c55e' : '#ef4444' }}>
            {fmt0(beliefScore.consistency)}
          </strong>
        </div>
        <div className="tl-divider" />
        {beliefAxes.map(([label, key]) => (
          <div key={key} className="tl-stat tl-belief-axis">
            <span>{label}</span>
            <strong>{fmt0(beliefScore[key])}</strong>
          </div>
        ))}
      </div>

      <div ref={electionBannerRef}>
        <ElectionBanner
          state={election}
          onJoin={handleElectionJoin}
          onLeave={handleElectionLeave}
          onOpenVoting={handleElectionVote}
        />
      </div>

      <FinishBanner
        cleared={isCleared && !isCouncilor && election.phase === 'idle'}
        over={isGameOver}
        stage={'citizen'}
        onReset={resetAll}
        onNextStage={handleGoToCityElection}
      />

      <div className="tl-goal">
        <span className="tl-goal-label">🎯 目標</span>
        <span className="tl-goal-text">
          {isCouncilor
            ? `市議会議員として成績を残し、国会議員になろう（衆議院議員選挙日まであと${Math.max(0, 49 - ((year - 1) * 12 + month))}カ月）`
            : isCleared
              ? `選挙で選ばれるように頑張ろう（選挙日まであと${TUNING.dayPerMonth - day}日）`
              : `立候補できるように頑張ろう（公示日まであと${TUNING.dayPerMonth - day}日）`
          }
        </span>
      </div>

      <div className="tl-settingsbar">
        <button className="tl-btn-settings" onClick={() => setShowSettings(true)}>⚙️ 設定</button>
      </div>

      <div className="tl-header">
        <h2 className="tl-title">タイムライン</h2>
        <div className="tl-filter">
          <label>カテゴリ:</label>
          <select value={filter} onChange={handleFilterChange}>
            {FILTER_OPTIONS.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'all' ? 'すべて'
                  : opt === 'news' ? 'ニュース'
                  : opt === 'sns'  ? 'SNS'
                  : opt === 'friend' ? '友人'
                  : opt === 'action' ? '行動'
                  : 'システム'}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="tl-friendsbar">
        <span>話す相手：</span>
        <select
          value={friends[0]?.id ?? ''}
          onChange={e => {
            const id = e.currentTarget.value;
            setFriends(prev => {
              const idx = prev.findIndex(f => f.id === id);
              if (idx <= 0) return prev;
              const copy = [...prev];
              const [picked] = copy.splice(idx, 1);
              return [picked, ...copy];
            });
          }}
        >
          {friends.map(f => (
            <option key={f.id} value={f.id}>
              {f.name}（保:{f.conservative}／リ:{f.liberal}／無:{f.apathetic}）
            </option>
          ))}
        </select>
        <span className="tl-followers">フォロワー {followers}</span>
      </div>

      <div className="tl-list">
        {election.phase === 'announced' && (
          <ElectionCard
            dateLabel={`Month ${election.month}, Year ${election.year}`}
            onJoin={handleElectionJoin}
            onOpenVoting={handleElectionVote}
          />
        )}

        {filtered.map(ev => {
          const meta = categoryMeta[ev.category];
          const Icon = meta.Icon;
          return (
            <div className={`tl-item ${ev.impact === 'good' ? 'good' : ev.impact === 'bad' ? 'bad' : ''}`} key={ev.id}>
              <div className="tl-icon" style={{ backgroundColor: meta.color }}>
                <Icon size={18} />
              </div>
              <div className="tl-body">
                <div className="tl-headline">
                  <span className="tl-date">{ev.date}</span>
                  <span className="tl-cat" style={{ color: meta.color }}>{meta.label}</span>
                  <span className="tl-badge" style={{ backgroundColor: impactColor[ev.impact] }} title={`影響度: ${impactLabel[ev.impact]}`}>
                    {impactLabel[ev.impact]}
                    {ev.delta?.cons      ? ` 保${ev.delta.cons > 0 ? '+' : ''}${ev.delta.cons}` : ''}
                    {ev.delta?.lib       ? ` リ${ev.delta.lib > 0 ? '+' : ''}${ev.delta.lib}` : ''}
                    {ev.delta?.apa       ? ` 無${ev.delta.apa > 0 ? '+' : ''}${ev.delta.apa}` : ''}
                    {ev.delta?.followers ? ` F${ev.delta.followers > 0 ? '+' : ''}${ev.delta.followers}` : ''}
                  </span>
                </div>
                <div className="tl-title-row">{ev.title}</div>
                {ev.description && <div className="tl-desc">{ev.description}</div>}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="tl-empty">このカテゴリのイベントはまだありません。</div>
        )}
      </div>

      <div className="tl-actions">
        {isCouncilor ? (
          // Phase 3: 市議議員
          <>
            <button onClick={() => addActionEvent('speech')} disabled={ap <= 0 || isGameOver}>街頭演説をする</button>
            <button onClick={() => addActionEvent('policy')} disabled={ap <= 0 || isGameOver}>政策立案</button>
            <button onClick={() => setShowSnsMenu(m => !m)}  disabled={ap <= 0 || isGameOver}>SNSに投稿</button>
            <button
              onClick={startDebate}
              disabled={ap < 2 || isGameOver}
              className="tl-btn-debate"
              title="AP2消費"
            >⚔️ 討論</button>
          </>
        ) : (
          // Phase 1/2: 一般市民 / 市議挑戦中 
          <>
            <button onClick={() => addActionEvent('speech')} disabled={ap <= 0 || isGameOver}>
              {isCleared ? '街頭演説' : '街頭演説を聴く'}
            </button>
            <button onClick={() => addActionEvent('talk')} disabled={ap <= 0 || isGameOver}>友達と話す</button>
            <button
              onClick={() => isCleared ? setShowSnsMenu(m => !m) : addActionEvent('post')}
              disabled={ap <= 0 || isGameOver}
            >SNSに投稿</button>
            <button
              onClick={startDebate}
              disabled={!isCleared || ap < 2 || isGameOver}
              className="tl-btn-debate"
              title={isCleared ? 'AP2消費' : '市議議員挑戦後に解放されます'}
            >⚔️ 討論</button>
          </>
        )}
      </div>

      {/* SNS プラットフォーム選択サブメニュー（Phase 2/3 共通） */}
      {(isCleared || isCouncilor) && showSnsMenu && (
        <div className="tl-sns-menu">
          <button onClick={() => addSnsPostAdvanced('youtube')} disabled={ap <= 0}>📹 YouTubeに投稿</button>
          <button onClick={() => addSnsPostAdvanced('x')}       disabled={ap <= 0}>𝕏 Xに投稿</button>
          <button className="tl-sns-cancel" onClick={() => setShowSnsMenu(false)}>キャンセル</button>
        </div>
      )}

      {/* Phase 3: 次の期へ（4ヶ月）*/}
      {isCouncilor ? (
        <button className="tl-nextperiod" onClick={nextCouncilPeriod} disabled={ap > 0 || isGameOver}>
          次の期へ（4ヶ月） — 残り {12 - councilTurn} 期
        </button>
      ) : (
        <button className="tl-nextday" onClick={nextDay} disabled={ap > 0 || isGameOver}>
          次の日へ（Day {day + 1}）
        </button>
      )}
    </div>
  );
}
