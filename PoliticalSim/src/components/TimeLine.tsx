
import React, { useEffect, useMemo, useRef, useState } from 'react';
import './timeline.css';
import { FiZap, FiUsers, FiTwitter, FiGlobe, FiBell } from 'react-icons/fi';

import { TUNING } from './config/tuning';

import {
  initialElectionState, announceElection, joinElection, leaveElection,
  openVoting, computeResult, decrementDaysLeft, getCampaignPhase,
  type ElectionState
} from './election/electionLogic.ts';
import ElectionBanner from './election/ElectionBanner.tsx';
import ElectionCard from './election/ElectionCard.tsx';
import VotingAnimation from './election/VotingAnimation';
import CouncilEndModal from './council/CouncilEndModal';

import { rollLifeEvent } from './life/lifeEventsLogic';

import { checkGameState } from './finish/gameState';
import FinishBanner from './finish/FinishBanner';
import SettingsScreen from './settings/SettingsScreen';

import type { CharType } from './start/StartScreen';

import {
  defaultBeliefScore, computeApprovalRate, noScandal,
  type BeliefScore, type ScandalState, type ScandalChoice, type DebateState,
} from '../types/gameTypes';
import DebateBattle, { createDebateState } from './battle/DebateBattle';
import type { DebateCloseResult } from './battle/DebateBattle';
import ScandalEvent, { createSecretaryScandal } from './scandal/ScandalEvent';

import FriendSelector from './friends/FriendSelector';
import FriendConversation from './friends/FriendConversation';
import type { FriendConvResult } from './friends/FriendConversation';
import type { FriendChar } from './friends/FriendChars';
import { DEFAULT_AFFINITY, AFFINITY_HIGH_1, AFFINITY_HIGH_2, AFFINITY_LOW } from './friends/FriendChars';

import NationalMpActions from './national/NationalMpActions';
import type { NmpActionResult } from './national/NationalMpActions';
import NationalEndingModal, { calcEnding } from './national/NationalEndingModal';
import type { EndingType } from './national/NationalEndingModal';
import { PARTIES } from './config/parties';

import PrimeMinisterActions from './pm/PrimeMinisterActions';
import type { PmActionResult } from './pm/PrimeMinisterActions';
import PrimeMinisterEndingModal, { calcPmEnding } from './pm/PrimeMinisterEndingModal';
import type { PmEndingType } from './pm/PrimeMinisterEndingModal';

import StatusScreen from './status/StatusScreen';

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

function randRange(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

type PlayerStatus = { comm: number; credibility: number; energy: number; };
type PublicOpinion = { conservative: number; liberal: number; apathetic: number; };
type NewsSpec = { title: string; desc: string; effect: Partial<PublicOpinion> };

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
    case 'activist':     return { status: { comm: 70, credibility: 50, energy: 80 }, followerBonus: 0 };
    case 'bureaucrat':   return { status: { comm: 50, credibility: 70, energy: 80 }, followerBonus: 0 };
    case 'entrepreneur': return { status: { comm: 50, credibility: 50, energy: 80 }, followerBonus: 200 };
    default:             return { status: { comm: 50, credibility: 50, energy: 80 }, followerBonus: 0 };
  }
}

// ---- マイルストーン閾値 ----
type MilestoneId =
  | 'cons100' | 'cons80' | 'lib100' | 'lib80' | 'cons50lib50'
  | 'approval100' | 'approval80' | 'approval20' | 'approval0'
  | 'consistency100' | 'consistency80' | 'consistency20' | 'consistency0';

const MILESTONES: { id: MilestoneId; label: string; check: (b: BeliefScore, approval: number) => boolean }[] = [
  { id: 'cons100',       label: '保守度が100になりました！',     check: (b) => b.conservative >= 100 },
  { id: 'cons80',        label: '保守度が80に達しました！',      check: (b) => b.conservative >= 80 },
  { id: 'lib100',        label: 'リベラル度が100になりました！',  check: (b) => (100 - b.conservative) >= 100 },
  { id: 'lib80',         label: 'リベラル度が80に達しました！',   check: (b) => (100 - b.conservative) >= 80 },
  { id: 'cons50lib50',   label: '保守とリベラルが50:50に！',      check: (b) => b.conservative === 50 },
  { id: 'approval100',   label: '支持率が100%になりました！',     check: (_, a) => a >= 100 },
  { id: 'approval80',    label: '支持率が80%に達しました！',      check: (_, a) => a >= 80 },
  { id: 'approval20',    label: '支持率が20%を下回りました…',     check: (_, a) => a <= 20 },
  { id: 'approval0',     label: '支持率が0%になりました…',        check: (_, a) => a <= 0 },
  { id: 'consistency100', label: '一貫性が100になりました！',      check: (b) => b.consistency >= 100 },
  { id: 'consistency80',  label: '一貫性が80に達しました！',       check: (b) => b.consistency >= 80 },
  { id: 'consistency20',  label: '一貫性が20を下回りました…',      check: (b) => b.consistency <= 20 },
  { id: 'consistency0',   label: '一貫性が0になりました…',         check: (b) => b.consistency <= 0 },
];

interface TimelineProps {
  initialConfig: { playerName: string; charType: CharType; belief?: BeliefScore } | null;
  onReturnToStart: () => void;
}

export default function Timeline({ initialConfig, onReturnToStart }: TimelineProps) {
  const [events,     setEvents]    = useState<TimelineEvent[]>(initialEvents);
  const [followers,  setFollowers] = useState<number>(randRange(80, 150));
  const [playerName, setPlayerName] = useState<string>('');
  const [charType,   setCharType]   = useState<CharType>('activist');

  const [status,  setStatus]  = useState<PlayerStatus>({ comm: 50, credibility: 50, energy: 80 });
  const [opinion, setOpinion] = useState<PublicOpinion>({ conservative: 70, liberal: 70, apathetic: 60 });
  const [election, setElection] = useState<ElectionState>(initialElectionState());

  const [beliefScore, setBeliefScore] = useState<BeliefScore>(defaultBeliefScore());

  const approvalRate = useMemo(() =>
    computeApprovalRate({
      conservative: opinion.conservative,
      liberal:      opinion.liberal,
      apathetic:    opinion.apathetic,
      consistency:  beliefScore.consistency,
    }),
    [opinion, beliefScore.consistency]
  );

  const [activeScandal, setActiveScandal] = useState<ScandalState>(noScandal());
  const [activeDebate,  setActiveDebate]  = useState<DebateState | null>(null);
  const [scandalTriggered, setScandalTriggered] = useState(false);

  const [speechDebateCount, setSpeechDebateCount] = useState(0);
  const [showSnsMenu, setShowSnsMenu] = useState(false);

  const [showSurvey,   setShowSurvey]   = useState(false);
  const [showStatus,   setShowStatus]   = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const [isCouncilor,        setIsCouncilor]        = useState(false);
  const [councilTurn,        setCouncilTurn]        = useState(0);
  const [showCouncilEndModal, setShowCouncilEndModal] = useState(false);

  // 友達会話システム
  const [showFriendSelector,   setShowFriendSelector]   = useState(false);
  const [selectedFriendChar,   setSelectedFriendChar]   = useState<FriendChar | null>(null);
  const [charAffinities,       setCharAffinities]       = useState<Record<string, number>>({});
  const [triggeredAffinityEvt, setTriggeredAffinityEvt] = useState<Set<string>>(new Set());

  // 国会議員フェーズ
  const [isNationalMP,    setIsNationalMP]    = useState(false);
  const [nationalTerm,    setNationalTerm]    = useState(1);
  const [nationalTurn,    setNationalTurn]    = useState(1);
  const [nationalMpEnded, setNationalMpEnded] = useState(false);
  const [policyScore,     setPolicyScore]     = useState(0);
  const [partyAffinity,   setPartyAffinity]   = useState(50);
  const [playerPartyId,   setPlayerPartyId]   = useState('rnp');
  const [nmpScandalCount, setNmpScandalCount] = useState(0);
  const [nmpEndingType,   setNmpEndingType]   = useState<EndingType | null>(null);

  // 総理フェーズ
  const [isPrimeMinister,    setIsPrimeMinister]    = useState(false);
  const [cabinetTerm,        setCabinetTerm]        = useState(1);
  const [cabinetTurn,        setCabinetTurn]        = useState(1);
  const [pmEnded,            setPmEnded]            = useState(false);
  const [diplomacyScore,     setDiplomacyScore]     = useState(50);
  const [economyScore,       setEconomyScore]       = useState(50);
  const [securityScore,      setSecurityScore]      = useState(50);
  const [coalitionStability, setCoalitionStability] = useState(70);
  const [pmScandalCount,     setPmScandalCount]     = useState(0);
  const [pmEndingType,       setPmEndingType]       = useState<PmEndingType | null>(null);

  // マイルストーンポップアップ
  const [triggeredMilestones, setTriggeredMilestones] = useState<Set<MilestoneId>>(new Set());
  const [milestonePopup, setMilestonePopup] = useState<string | null>(null);

  type PendingVote = {
    playerShare: number; rivalShare: number;
    turnout: number; won: boolean;
    finalState: ElectionState;
    type: 'city' | 'house';
    rivalName: string;
  };
  const [pendingVote, setPendingVote] = useState<PendingVote | null>(null);

  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
  const [day,  setDay]  = useState<number>(1);
  const [ap,   setAp]   = useState<number>(3);
  const [month, setMonth] = useState<number>(1);
  const [year,  setYear]  = useState<number>(1);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isCleared,  setIsCleared]  = useState(false);

  const fmt0 = (n: number) => Math.floor(n).toString();

  // ---- マイルストーンチェック ----
  function checkMilestones(bs: BeliefScore, approval: number) {
    setTriggeredMilestones(prev => {
      const next = new Set(prev);
      for (const m of MILESTONES) {
        if (!next.has(m.id) && m.check(bs, approval)) {
          next.add(m.id);
          setMilestonePopup(m.label);
          break; // 1つずつ表示
        }
      }
      return next;
    });
  }

  // ---- 保守/リベラルを100固定で更新するヘルパ ----
  function updateConservative(prev: BeliefScore, delta: number): BeliefScore {
    const newCons = clamp(prev.conservative + delta, 0, 100);
    return { ...prev, conservative: newCons };
  }

  // ---------- スキャンダル結果ハンドラ ----------
  function handleScandalClose(choice: ScandalChoice) {
    const { approvalDelta, consistencyDelta, credibilityDelta } = choice.outcome;
    setBeliefScore(b => {
      const nb = { ...b, consistency: clamp(b.consistency + consistencyDelta, 0, 100) };
      checkMilestones(nb, approvalRate);
      return nb;
    });
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
  function handleDebateClose(res: DebateCloseResult) {
    const won = res.result === 'win';
    const inElection = election.phase === 'announced' && election.participating;
    const attnMul = inElection ? 2 : 1;

    setBeliefScore(b => {
      const nb1 = { ...b, consistency: clamp(b.consistency + res.consistencyDelta, 0, 100) };
      const nb2 = updateConservative(nb1, res.conservativeDelta);
      checkMilestones(nb2, approvalRate);
      return nb2;
    });
    setOpinion(o => ({
      conservative: clamp(o.conservative + (won ? +3 : -3) + res.approvalDelta * 0.5, 0, 100),
      liberal:      clamp(o.liberal      + (won ? +3 : -3) + res.approvalDelta * 0.5, 0, 100),
      apathetic:    clamp(o.apathetic    + (won ? -4 : +4) * attnMul, 0, 100),
    }));
    setStatus(s => ({
      ...s,
      credibility: clamp(s.credibility + (won ? +8 : -5), 0, 100),
      comm:        clamp(s.comm        + (won ? +5 : -2), 0, 100),
    }));
    const followerGain = 200 * attnMul;
    if (won) setFollowers(n => n + followerGain);
    setActiveDebate(null);
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'action',
      title: `討論バトル：${won ? '勝利！' : '敗北…'}${inElection ? '【選挙期間】' : ''}`,
      description: won
        ? inElection
          ? `選挙期間中の討論勝利！注目度が大幅に上昇し、支持者が${followerGain}人増加しました。`
          : '鋭い論法で相手を圧倒。支持者が増加し、信頼が高まりました。'
        : inElection
          ? '選挙期間中の討論敗北。注目されていた分、無関心層が増加しました。'
          : '議論で押し切られました。次回に備えて信念を整理しましょう。',
      impact: won ? 'good' : 'bad',
      delta: { followers: won ? followerGain : 0 },
    }, ...prev]);
    setAp(x => Math.max(0, x - 2));
  }

  // ---------- 討論開始 ----------
  function startDebate() {
    if (ap < 2 || isGameOver || !isCleared) return;
    const debate = createDebateState({});
    setActiveDebate(debate);
    setSpeechDebateCount(c => c + 1);
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'action',
      title: '討論バトルに参加した',
      description: `${debate.opponentName}（${debate.opponentParty}）と「${debate.topic}」について討論します。`,
      impact: 'neutral',
    }, ...prev]);
  }

  // ---------- 友達会話結果ハンドラ ----------
  function handleFriendConvClose(result: FriendConvResult) {
    setSelectedFriendChar(null);

    setBeliefScore(b => {
      const nb = updateConservative(b, result.conservativeDelta);
      const nb2 = { ...nb, consistency: clamp(nb.consistency + result.consistencyDelta, 0, 100) };
      checkMilestones(nb2, approvalRate);
      return nb2;
    });
    setOpinion(o => ({
      conservative: clamp(o.conservative + result.approvalDelta * 0.3, 0, 100),
      liberal:      clamp(o.liberal      + result.approvalDelta * 0.3, 0, 100),
      apathetic:    clamp(o.apathetic    - result.approvalDelta * 0.2, 0, 100),
    }));
    if (result.commDelta) {
      setStatus(s => ({ ...s, comm: clamp(s.comm + result.commDelta, 0, 100) }));
    }
    if (result.followersDelta) {
      setFollowers(n => Math.max(0, n + result.followersDelta));
    }

    // ---- 好感度更新 & 閾値イベント ----
    const charId = result.charId;
    setCharAffinities(prev => {
      const current = prev[charId] ?? DEFAULT_AFFINITY;
      const next    = clamp(current + result.affinityDelta, 0, 100);
      const updated = { ...prev, [charId]: next };

      setTriggeredAffinityEvt(evts => {
        const nextEvts = new Set(evts);
        const evtKey90 = `${charId}_high90`;
        const evtKey70 = `${charId}_high70`;
        const evtKey20 = `${charId}_low20`;

        if (next >= AFFINITY_HIGH_2 && !nextEvts.has(evtKey90)) {
          nextEvts.add(evtKey90);
          // 特別支持者イベント
          setFollowers(n => n + 500);
          setOpinion(o => ({
            conservative: clamp(o.conservative + 1.5, 0, 100),
            liberal:      clamp(o.liberal      + 1.5, 0, 100),
            apathetic:    clamp(o.apathetic    - 2,   0, 100),
          }));
          setMilestonePopup(`⭐ ${result.charName}が特別支持者になった！フォロワー+500、支持率UP`);
          setEvents(prevEv => [{
            id: crypto.randomUUID(), date: `Day ${day}`, category: 'friend',
            title: `【特別支持者】${result.charName}が熱烈に支持してくれる`,
            description: '長年の付き合いで信頼が最高潮に。口コミでフォロワーが500人増えました。',
            impact: 'good', delta: { followers: 500 },
          }, ...prevEv]);
        } else if (next >= AFFINITY_HIGH_1 && !nextEvts.has(evtKey70)) {
          nextEvts.add(evtKey70);
          // 個別相談イベント
          setBeliefScore(b => {
            const nb = { ...b, consistency: clamp(b.consistency + 2, 0, 100) };
            checkMilestones(nb, approvalRate);
            return nb;
          });
          setOpinion(o => ({
            conservative: clamp(o.conservative + 1, 0, 100),
            liberal:      clamp(o.liberal      + 1, 0, 100),
            apathetic:    clamp(o.apathetic    - 1, 0, 100),
          }));
          setMilestonePopup(`💬 ${result.charName}から個別相談を受けた！一貫性+2、支持率UP`);
          setEvents(prevEv => [{
            id: crypto.randomUUID(), date: `Day ${day}`, category: 'friend',
            title: `【個別相談】${result.charName}から深い相談を受けた`,
            description: '信頼関係が深まり、本音で話し合えた。一貫性と支持率が向上しました。',
            impact: 'good',
          }, ...prevEv]);
        } else if (next <= AFFINITY_LOW && !nextEvts.has(evtKey20)) {
          nextEvts.add(evtKey20);
          // 関係悪化イベント
          setOpinion(o => ({
            conservative: clamp(o.conservative - 1, 0, 100),
            liberal:      clamp(o.liberal      - 1, 0, 100),
            apathetic:    clamp(o.apathetic    + 2, 0, 100),
          }));
          setMilestonePopup(`❄️ ${result.charName}との関係が悪化…支持率にも影響`);
          setEvents(prevEv => [{
            id: crypto.randomUUID(), date: `Day ${day}`, category: 'friend',
            title: `【関係悪化】${result.charName}との関係がぎこちなくなった`,
            description: '意見の食い違いが積み重なり、関係が冷えてきた。無関心層が増加しました。',
            impact: 'bad',
          }, ...prevEv]);
        }
        return nextEvts;
      });

      return updated;
    });

    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Day ${day}`, category: 'friend',
      title: `${result.charName}と話した`,
      description: '会話を通じてパラメータが変化しました。',
      impact: result.approvalDelta >= 0 ? 'good' : 'neutral',
      delta: {
        cons:      result.conservativeDelta !== 0 ? result.conservativeDelta : undefined,
        followers: result.followersDelta    !== 0 ? result.followersDelta    : undefined,
      },
    }, ...prev]);

    setAp(x => Math.max(0, x - 1));
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

    if (election.phase === 'announced') {
      const cp = getCampaignPhase(election.daysLeft);
      if (cp === 'early_voting' && election.participating) {
        const consistencyBonus = (beliefScore.consistency - 50) * 0.05;
        setOpinion(o => ({
          conservative: clamp(o.conservative + consistencyBonus * 0.5, 0, 100),
          liberal:      clamp(o.liberal      + consistencyBonus * 0.5, 0, 100),
          apathetic:    clamp(o.apathetic    - consistencyBonus * 0.3, 0, 100),
        }));
        if (Math.abs(consistencyBonus) >= 0.8) {
          setEvents(prev => [{
            id: crypto.randomUUID(), date: `Day ${day + 1}`, category: 'system',
            title: consistencyBonus > 0 ? '期日前投票：支持率上昇' : '期日前投票：支持率低下',
            description: consistencyBonus > 0
              ? `一貫した主張が有権者に伝わっています（一貫性: ${Math.floor(beliefScore.consistency)}）`
              : `発言の一貫性の低さが不信感につながっています（一貫性: ${Math.floor(beliefScore.consistency)}）`,
            impact: consistencyBonus > 0 ? 'good' : 'bad',
          }, ...prev]);
        }
      }
      setElection(prev => decrementDaysLeft(prev));
    }

    if (isCleared && !isGameOver && !activeScandal.active) {
      const scandalProb = (100 - beliefScore.consistency) / 400;
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

  const handleElectionJoin  = () => setElection(prev => joinElection(prev));
  const handleElectionLeave = () => setElection(prev => leaveElection(prev));
  const handleGoToCityElection = () => {
    const announced = announceElection(initialElectionState(), month, year);
    setElection(joinElection(announced));
  };

  const handleElectionCount = () => {
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

  /** 保守度スコアから所属政党を自動決定 */
  function assignParty(conservative: number): string {
    const sorted = [...PARTIES].sort((a, b) => {
      const da = Math.abs(a.beliefs.conservative - conservative);
      const db = Math.abs(b.beliefs.conservative - conservative);
      return da - db;
    });
    return sorted[0].id;
  }

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
      setElection(initialElectionState());
    } else {
      // 衆議院選挙（初回 or 再選）
      if (!isNationalMP && won) {
        // 初当選 → 国会議員フェーズへ
        const partyId = assignParty(beliefScore.conservative);
        setIsNationalMP(true);
        setIsCouncilor(false);
        setNationalTerm(1);
        setNationalTurn(1);
        setPlayerPartyId(partyId);
        setPartyAffinity(50);
        setPolicyScore(0);
        setNmpScandalCount(0);
        setElection(initialElectionState());
        setEvents(prev => [{
          id: crypto.randomUUID(), date: `Y${year}-M${month}`, category: 'system',
          title: '衆議院議員に当選！国会議員フェーズ開始',
          description: `${PARTIES.find(p => p.id === partyId)?.name ?? ''}に所属し、国政の舞台へ。`,
          impact: 'good',
        }, ...prev]);
      } else if (isNationalMP && won) {
        // 再選
        const newTerm = nationalTerm + 1;
        if (newTerm >= 4) {
          // 3期満了エンディング
          const et = calcEnding(policyScore, approvalRate, partyAffinity, nmpScandalCount, newTerm);
          setNmpEndingType(et);
          setNationalMpEnded(true);
          setIsNationalMP(false);
        } else {
          setNationalTerm(newTerm);
          setNationalTurn(1);
          setAp(TUNING.apPerDay);
          setElection(initialElectionState());
          setEvents(prev => [{
            id: crypto.randomUUID(), date: `Y${year}-M${month}`, category: 'system',
            title: `衆議院議員 第${newTerm}期 再選！`,
            description: `引き続き国会議員として活動する。（12ターン = 1年）`,
            impact: 'good',
          }, ...prev]);
        }
      } else {
        // 落選
        if (isNationalMP) {
          // 国会議員が再選失敗 → エンディング
          const et = calcEnding(policyScore, approvalRate, partyAffinity, nmpScandalCount, nationalTerm);
          setNmpEndingType(et);
          setNationalMpEnded(true);
          setIsNationalMP(false);
        }
        setElection(pendingVote.finalState);
      }
    }
    setPendingVote(null);
  };

  function nextCouncilPeriod() {
    if (ap > 0 || isGameOver) return;
    const newTurn = councilTurn + 1;
    let newMonth = month + 4;
    let addYears = 0;
    while (newMonth > 12) { newMonth -= 12; addYears++; }
    setMonth(newMonth);
    if (addYears > 0) setYear(y => y + addYears);
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
    if (newTurn >= 12) setShowCouncilEndModal(true);
    setAp(TUNING.apPerDay);
  }

  function handleReCityCouncil() {
    setIsCouncilor(false);
    setCouncilTurn(0);
    setShowCouncilEndModal(false);
    setElection(announceElection(initialElectionState(), month, year));
    setEvents(prev => [{
      id: crypto.randomUUID(), date: `Y${year}-M${month}`, category: 'system',
      title: '市議選再挑戦を決意',
      description: '再び市議会議員選挙に立候補することを決めました。',
      impact: 'good',
    }, ...prev]);
  }

  function handleHouseElection() {
    setShowCouncilEndModal(false);
    const withVoting = openVoting({ ...initialElectionState(), phase: 'voting', month, year });
    const finalState = computeResult(withVoting, {
      conservative: opinion.conservative,
      liberal:      opinion.liberal,
      apathetic:    opinion.apathetic,
      credibility:  status.credibility,
      comm:         status.comm,
      followers,
      consistency:  beliefScore.consistency,
    }, 55);
    if (!finalState.lastResult) return;
    const { voteShare, rivalShare, turnout, won } = finalState.lastResult;
    setPendingVote({
      playerShare: voteShare, rivalShare, turnout, won,
      finalState, type: 'house', rivalName: '山田 太郎（現職議員）',
    });
  }

  // ---------- 国会議員フェーズ：行動結果ハンドラ ----------
  function handleNmpAction(res: NmpActionResult) {
    setOpinion(o => ({
      conservative: clamp(o.conservative + res.approvalDelta * 0.4, 0, 100),
      liberal:      clamp(o.liberal      + res.approvalDelta * 0.4, 0, 100),
      apathetic:    clamp(o.apathetic    - res.approvalDelta * 0.3, 0, 100),
    }));
    setBeliefScore(b => {
      const nb = { ...b, consistency: clamp(b.consistency + res.consistencyDelta, 0, 100) };
      checkMilestones(nb, approvalRate);
      return nb;
    });
    setPartyAffinity(v => clamp(v + res.partyAffinityDelta, 0, 100));
    if (res.followersDelta) setFollowers(n => Math.max(0, n + res.followersDelta));
    if (res.policyScoreDelta) setPolicyScore(s => s + res.policyScoreDelta);
    if (res.scandalOccurred)  setNmpScandalCount(c => c + 1);

    setEvents(prev => [{
      id: crypto.randomUUID(),
      date: `Term${nationalTerm}-T${nationalTurn}`,
      category: 'action',
      title: res.eventTitle,
      description: res.eventDesc,
      impact: res.impact,
      delta: {
        followers: res.followersDelta !== 0 ? res.followersDelta : undefined,
      },
    }, ...prev]);

    setAp(x => Math.max(0, x - 1));
  }

  // ---------- 国会議員フェーズ：次のターンへ ----------
  function nextNationalTurn() {
    if (ap > 0 || isGameOver) return;
    const newTurn = nationalTurn + 1;
    if (newTurn > 12) {
      // 1年終了 → 衆議院選挙（handleHouseElection を再利用）
      handleHouseElection();
      setNationalTurn(1);
    } else {
      setNationalTurn(newTurn);
      setAp(TUNING.apPerDay);
      setEvents(prev => [{
        id: crypto.randomUUID(),
        date: `Term${nationalTerm}-T${newTurn}`,
        category: 'system',
        title: `第${nationalTerm}期 ターン${newTurn} 開始`,
        description: '国会議員として次の活動を選択してください。',
        impact: 'neutral',
      }, ...prev]);
    }
  }

  // ---------- 総理フェーズ：総裁選挑戦 ----------
  function handlePMElection() {
    if (ap <= 0) return;
    const successProb = policyScore / 100 * 0.3 + partyAffinity / 100 * 0.4 + approvalRate / 100 * 0.3;
    const won = Math.random() < successProb;
    if (won) {
      setIsPrimeMinister(true);
      setIsNationalMP(false);
      setCabinetTerm(1);
      setCabinetTurn(1);
      setDiplomacyScore(50);
      setEconomyScore(50);
      setSecurityScore(50);
      setCoalitionStability(70);
      setPmScandalCount(0);
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `Y${year}-M${month}`, category: 'system',
        title: '自民党総裁選に当選！内閣総理大臣に就任',
        description: '国家の最高指導者として、内閣総理大臣に就任しました。',
        impact: 'good',
      }, ...prev]);
    } else {
      setPartyAffinity(v => clamp(v - 10, 0, 100));
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `Y${year}-M${month}`, category: 'system',
        title: '総裁選に敗北…',
        description: '総裁選には及ばなかった。党内での立場が少し低下した。',
        impact: 'bad',
      }, ...prev]);
    }
    setAp(x => Math.max(0, x - 1));
  }

  // ---------- 総理フェーズ：行動結果ハンドラ ----------
  function handlePmAction(res: PmActionResult) {
    setOpinion(o => ({
      conservative: clamp(o.conservative + res.approvalDelta * 0.4, 0, 100),
      liberal:      clamp(o.liberal      + res.approvalDelta * 0.4, 0, 100),
      apathetic:    clamp(o.apathetic    - res.approvalDelta * 0.3, 0, 100),
    }));
    setBeliefScore(b => {
      const nb = { ...b, consistency: clamp(b.consistency + res.consistencyDelta, 0, 100) };
      checkMilestones(nb, approvalRate);
      return nb;
    });
    setPartyAffinity(v => clamp(v + res.partyAffinityDelta, 0, 100));
    if (res.followersDelta)   setFollowers(n => Math.max(0, n + res.followersDelta));
    if (res.policyScoreDelta) setPolicyScore(s => s + res.policyScoreDelta);
    setDiplomacyScore(s => clamp(s + res.diplomacyDelta, 0, 100));
    setEconomyScore(s => clamp(s + res.economyDelta, 0, 100));
    setSecurityScore(s => clamp(s + res.securityDelta, 0, 100));
    setCoalitionStability(s => clamp(s + res.coalitionDelta, 0, 100));
    if (res.pmScandalOccurred) setPmScandalCount(c => c + 1);
    setEvents(prev => [{
      id: crypto.randomUUID(),
      date: `内閣${cabinetTerm}期-T${cabinetTurn}`,
      category: 'action',
      title: res.eventTitle,
      description: res.eventDesc,
      impact: res.impact,
      delta: { followers: res.followersDelta !== 0 ? res.followersDelta : undefined },
    }, ...prev]);
    setAp(x => Math.max(0, x - 1));
  }

  // ---------- 総理フェーズ：次のターンへ ----------
  const CABINET_CRISIS: Array<{
    title: string; desc: string;
    diplomacy?: number; economy?: number; security?: number;
    approval?: number; partyAffinity?: number; coalition?: number;
    scandal?: boolean;
  }> = [
    { title: '大規模自然災害が発生',  desc: '緊急対応を迫られ、国民の目が集まる。', economy: -3, security: -2, approval: -4 },
    { title: '閣僚が不祥事を起こした', desc: '野党が猛攻撃。党内も動揺している。', approval: -6, partyAffinity: -5, scandal: true },
    { title: '経済指標が急悪化',       desc: '市場も動揺。財政政策の見直しを迫られる。', economy: -8, approval: -5 },
    { title: '国際社会で外交摩擦',     desc: '外交ルートが一時緊張状態に。', diplomacy: -5, security: -2, approval: -2 },
    { title: '連立相手が反発',         desc: '連立の枠組みが揺らいでいる。', coalition: -12, partyAffinity: -5 },
  ];

  function nextCabinetTurn() {
    if (ap > 0 || isGameOver) return;

    // 危機イベント（20%確率）
    if (Math.random() < 0.20) {
      const crisis = CABINET_CRISIS[Math.floor(Math.random() * CABINET_CRISIS.length)];
      if (crisis.diplomacy)     setDiplomacyScore(s => clamp(s + crisis.diplomacy!, 0, 100));
      if (crisis.economy)       setEconomyScore(s => clamp(s + crisis.economy!, 0, 100));
      if (crisis.security)      setSecurityScore(s => clamp(s + crisis.security!, 0, 100));
      if (crisis.coalition)     setCoalitionStability(s => clamp(s + crisis.coalition!, 0, 100));
      if (crisis.approval) {
        const d = crisis.approval;
        setOpinion(o => ({
          conservative: clamp(o.conservative + d * 0.4, 0, 100),
          liberal:      clamp(o.liberal      + d * 0.4, 0, 100),
          apathetic:    clamp(o.apathetic    - d * 0.3, 0, 100),
        }));
      }
      if (crisis.partyAffinity) setPartyAffinity(v => clamp(v + crisis.partyAffinity!, 0, 100));
      if (crisis.scandal)       setPmScandalCount(c => c + 1);
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `内閣${cabinetTerm}期-T${cabinetTurn}`, category: 'system',
        title: `【危機】${crisis.title}`,
        description: crisis.desc,
        impact: 'bad',
      }, ...prev]);
    }

    // 支持率急落チェック
    if (approvalRate < 10) {
      const et = calcPmEnding(diplomacyScore, economyScore, securityScore, approvalRate, coalitionStability, pmScandalCount, cabinetTerm);
      setPmEndingType(et);
      setPmEnded(true);
      setIsPrimeMinister(false);
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `内閣${cabinetTerm}期-T${cabinetTurn}`, category: 'system',
        title: '支持率の急落で自発的に辞任',
        description: '国民の信任を失い、総辞職を余儀なくされた。',
        impact: 'bad',
      }, ...prev]);
      setAp(TUNING.apPerDay);
      return;
    }

    const newTurn = cabinetTurn + 1;
    if (newTurn > 12) {
      const newCabinetTerm = cabinetTerm + 1;
      setCabinetTerm(newCabinetTerm);
      setCabinetTurn(1);

      // 不信任チェック
      if (coalitionStability < 25 && Math.random() < 0.6) {
        const et = calcPmEnding(diplomacyScore, economyScore, securityScore, approvalRate, coalitionStability, pmScandalCount, cabinetTerm);
        setPmEndingType(et);
        setPmEnded(true);
        setIsPrimeMinister(false);
        setEvents(prev => [{
          id: crypto.randomUUID(), date: `内閣${cabinetTerm}期`, category: 'system',
          title: '内閣不信任案が可決…総辞職',
          description: '連立の崩壊により、内閣不信任案が可決されました。',
          impact: 'bad',
        }, ...prev]);
        setAp(TUNING.apPerDay);
        return;
      }

      // 3期超えチェック
      if (newCabinetTerm >= 4) {
        const et = calcPmEnding(diplomacyScore, economyScore, securityScore, approvalRate, coalitionStability, pmScandalCount, cabinetTerm);
        setPmEndingType(et);
        setPmEnded(true);
        setIsPrimeMinister(false);
        setEvents(prev => [{
          id: crypto.randomUUID(), date: `内閣${cabinetTerm}期`, category: 'system',
          title: '3期を超える長期政権が終幕',
          description: '歴史に名を刻む長期政権でした。お疲れさまでした。',
          impact: 'good',
        }, ...prev]);
        setAp(TUNING.apPerDay);
        return;
      }

      setEvents(prev => [{
        id: crypto.randomUUID(), date: `内閣${newCabinetTerm}期`, category: 'system',
        title: `第${newCabinetTerm}次内閣発足`,
        description: '新たな内閣として引き続き国家運営にあたる。',
        impact: 'good',
      }, ...prev]);
    } else {
      setCabinetTurn(newTurn);
      setEvents(prev => [{
        id: crypto.randomUUID(), date: `内閣${cabinetTerm}期-T${newTurn}`, category: 'system',
        title: `内閣第${cabinetTerm}期 ターン${newTurn} 開始`,
        description: '総理大臣として次の政策を選択してください。',
        impact: 'neutral',
      }, ...prev]);
    }

    setAp(TUNING.apPerDay);
  }

  function resetAll() {
    localStorage.removeItem(SAVE_KEY);
    onReturnToStart();
  }

  const NEWS_POOL: NewsSpec[] = [
    { title: '経済指標が改善',    desc: '市況がやや持ち直しムード。',     effect: { conservative: +0.5, liberal: +0.5, apathetic: -0.5 } },
    { title: '物価高の懸念強まる', desc: '生活実感と政府評価にギャップ。',  effect: { conservative: -0.5, liberal: +0.5, apathetic: +0.5 } },
    { title: '災害対応が迅速',     desc: '政府への信頼がわずかに上向く。', effect: { conservative: +0.8, liberal: +0.3, apathetic: -0.6 } },
    { title: '外交会談が難航',     desc: '国際関係の先行きに不安。',       effect: { conservative: -0.6, liberal: -0.6, apathetic: +0.6 } },
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
      const deltaApa  = isCouncilor ? -5 : -4;
      const credDelta = isCouncilor ?  5 :  3;
      const consDelta = isCouncilor ?  2 :  1;
      setStatus(s => ({ ...s, credibility: Math.min(100, s.credibility + credDelta), energy: Math.max(0, s.energy - 4) }));
      setOpinion(o => ({ ...o, apathetic: Math.max(0, o.apathetic + deltaApa) }));
      setBeliefScore(b => {
        const nb = { ...b, consistency: clamp(b.consistency + consDelta, 0, 100) };
        checkMilestones(nb, approvalRate);
        return nb;
      });
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
      setBeliefScore(b => {
        const nb = { ...b, consistency: clamp(b.consistency + 3, 0, 100) };
        checkMilestones(nb, approvalRate);
        return nb;
      });
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
      // 一般市民フェーズ: FriendSelector を表示
      setShowFriendSelector(true);
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
      if (bad) {
        setBeliefScore(b => {
          const nb = { ...b, consistency: clamp(b.consistency - 3, 0, 100) };
          checkMilestones(nb, approvalRate);
          return nb;
        });
      }
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
      const opinionPenalty = isYouTube ? 3 : 5;
      const consistencyPenalty = isYouTube ? 5 : 8;
      setOpinion(o => ({
        conservative: clamp(o.conservative - opinionPenalty, 0, 100),
        liberal:      clamp(o.liberal      - opinionPenalty, 0, 100),
        apathetic:    clamp(o.apathetic    + opinionPenalty, 0, 100),
      }));
      setBeliefScore(b => {
        const nb = { ...b, consistency: clamp(b.consistency - consistencyPenalty, 0, 100) };
        checkMilestones(nb, approvalRate);
        return nb;
      });
    } else if (bad) {
      setBeliefScore(b => {
        const nb = { ...b, consistency: clamp(b.consistency - 3, 0, 100) };
        checkMilestones(nb, approvalRate);
        return nb;
      });
    }

    const warningYT = '【忠告】街頭演説・討論の実績不足が動画の薄さとして露呈しました。支持率と一貫性が低下。';
    const warningX  = '【忠告】街頭演説・討論の実績不足で発言の根拠が薄いと指摘されました。支持率と一貫性が低下。';

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
    events: TimelineEvent[]; followers: number;
    status: PlayerStatus; opinion: PublicOpinion;
    day: number; month: number; year: number; ap: number;
    election: ElectionState; isGameOver: boolean; isCleared: boolean;
    playerName: string; charType: CharType;
    beliefScore: BeliefScore; scandalTriggered: boolean;
    speechDebateCount: number;
    isCouncilor: boolean; councilTurn: number;
    triggeredMilestones: MilestoneId[];
    charAffinities: Record<string, number>;
    triggeredAffinityEvt: string[];
    isNationalMP: boolean; nationalTerm: number; nationalTurn: number;
    nationalMpEnded: boolean; policyScore: number; partyAffinity: number;
    playerPartyId: string; nmpScandalCount: number; nmpEndingType: EndingType | null;
    isPrimeMinister: boolean; cabinetTerm: number; cabinetTurn: number;
    pmEnded: boolean; diplomacyScore: number; economyScore: number;
    securityScore: number; coalitionStability: number; pmScandalCount: number;
    pmEndingType: PmEndingType | null;
  };
  const SAVE_KEY = 'politics-sim-save-v9';

  function saveGame() {
    const data: SaveState = {
      events, followers, status, opinion,
      day, month, year, ap, election, isGameOver, isCleared,
      playerName, charType, beliefScore, scandalTriggered,
      speechDebateCount, isCouncilor, councilTurn,
      triggeredMilestones: Array.from(triggeredMilestones),
      charAffinities,
      triggeredAffinityEvt: Array.from(triggeredAffinityEvt),
      isNationalMP, nationalTerm, nationalTurn, nationalMpEnded,
      policyScore, partyAffinity, playerPartyId, nmpScandalCount, nmpEndingType,
      isPrimeMinister, cabinetTerm, cabinetTurn, pmEnded,
      diplomacyScore, economyScore, securityScore, coalitionStability,
      pmScandalCount, pmEndingType,
    };
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
  }

  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as SaveState;
      setEvents(d.events); setFollowers(d.followers);
      setStatus(d.status); setOpinion(d.opinion);
      setDay(d.day); setMonth(d.month); setYear(d.year); setAp(d.ap);
      setElection({ ...d.election, daysLeft: d.election.daysLeft ?? 0 });
      setIsGameOver(d.isGameOver); setIsCleared(d.isCleared);
      if (d.playerName)  setPlayerName(d.playerName);
      if (d.charType)    setCharType(d.charType);
      if (d.beliefScore) setBeliefScore(d.beliefScore);
      if (d.scandalTriggered  !== undefined) setScandalTriggered(d.scandalTriggered);
      if (d.speechDebateCount !== undefined) setSpeechDebateCount(d.speechDebateCount);
      if (d.isCouncilor   !== undefined) setIsCouncilor(d.isCouncilor);
      if (d.councilTurn   !== undefined) setCouncilTurn(d.councilTurn);
      if (d.triggeredMilestones)   setTriggeredMilestones(new Set(d.triggeredMilestones));
      if (d.charAffinities)        setCharAffinities(d.charAffinities);
      if (d.triggeredAffinityEvt)  setTriggeredAffinityEvt(new Set(d.triggeredAffinityEvt));
      if (d.isNationalMP   !== undefined) setIsNationalMP(d.isNationalMP);
      if (d.nationalTerm   !== undefined) setNationalTerm(d.nationalTerm);
      if (d.nationalTurn   !== undefined) setNationalTurn(d.nationalTurn);
      if (d.nationalMpEnded !== undefined) setNationalMpEnded(d.nationalMpEnded);
      if (d.policyScore    !== undefined) setPolicyScore(d.policyScore);
      if (d.partyAffinity  !== undefined) setPartyAffinity(d.partyAffinity);
      if (d.playerPartyId)                setPlayerPartyId(d.playerPartyId);
      if (d.nmpScandalCount !== undefined) setNmpScandalCount(d.nmpScandalCount);
      if (d.nmpEndingType)                setNmpEndingType(d.nmpEndingType);
      if (d.isPrimeMinister   !== undefined) setIsPrimeMinister(d.isPrimeMinister);
      if (d.cabinetTerm       !== undefined) setCabinetTerm(d.cabinetTerm);
      if (d.cabinetTurn       !== undefined) setCabinetTurn(d.cabinetTurn);
      if (d.pmEnded           !== undefined) setPmEnded(d.pmEnded);
      if (d.diplomacyScore    !== undefined) setDiplomacyScore(d.diplomacyScore);
      if (d.economyScore      !== undefined) setEconomyScore(d.economyScore);
      if (d.securityScore     !== undefined) setSecurityScore(d.securityScore);
      if (d.coalitionStability !== undefined) setCoalitionStability(d.coalitionStability);
      if (d.pmScandalCount    !== undefined) setPmScandalCount(d.pmScandalCount);
      if (d.pmEndingType)                    setPmEndingType(d.pmEndingType);
    } catch {}
  }

  React.useEffect(() => { saveGame(); }, [
    events, status, opinion, followers, day, month, year, ap,
    election, isGameOver, isCleared, beliefScore, scandalTriggered,
    speechDebateCount, isCouncilor, councilTurn, triggeredMilestones,
    charAffinities, triggeredAffinityEvt,
    isNationalMP, nationalTerm, nationalTurn, nationalMpEnded,
    policyScore, partyAffinity, playerPartyId, nmpScandalCount, nmpEndingType,
    isPrimeMinister, cabinetTerm, cabinetTurn, pmEnded,
    diplomacyScore, economyScore, securityScore, coalitionStability,
    pmScandalCount, pmEndingType,
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

  const electionBannerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (election.phase === 'announced' && electionBannerRef.current) {
      electionBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [election.phase]);

  // ===== 設定画面 =====
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
      {/* ---- 総理エンディングモーダル ---- */}
      {pmEnded && pmEndingType && (
        <PrimeMinisterEndingModal
          endingType={pmEndingType}
          cabinetTerm={cabinetTerm}
          diplomacyScore={diplomacyScore}
          economyScore={economyScore}
          securityScore={securityScore}
          onReturnToTitle={resetAll}
        />
      )}

      {/* ---- 国会議員エンディングモーダル ---- */}
      {nationalMpEnded && nmpEndingType && (
        <NationalEndingModal
          endingType={nmpEndingType}
          policyScore={policyScore}
          nationalTerm={nationalTerm}
          onReturnToTitle={resetAll}
        />
      )}

      {/* ---- モーダル群 ---- */}
      {showCouncilEndModal && (
        <CouncilEndModal
          onReCityCouncil={handleReCityCouncil}
          onHouseElection={handleHouseElection}
        />
      )}
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
      {activeScandal.active && (
        <ScandalEvent state={activeScandal} onClose={handleScandalClose} />
      )}
      {activeDebate?.active && (
        <DebateBattle state={activeDebate} onClose={handleDebateClose} />
      )}

      {/* ---- 友達選択・会話 ---- */}
      {showFriendSelector && !selectedFriendChar && (
        <FriendSelector
          onSelect={char => {
            setShowFriendSelector(false);
            setSelectedFriendChar(char);
          }}
          onCancel={() => setShowFriendSelector(false)}
          charAffinities={charAffinities}
        />
      )}
      {selectedFriendChar && (
        <FriendConversation
          char={selectedFriendChar}
          onClose={handleFriendConvClose}
        />
      )}

      {/* ---- ステータス画面 ---- */}
      {showStatus && (
        <StatusScreen
          playerName={playerName}
          charType={charType}
          beliefScore={beliefScore}
          approvalRate={approvalRate}
          conservative={opinion.conservative}
          liberal={opinion.liberal}
          apathetic={opinion.apathetic}
          comm={status.comm}
          credibility={status.credibility}
          energy={status.energy}
          followers={followers}
          day={day}
          month={month}
          year={year}
          ap={ap}
          onClose={() => setShowStatus(false)}
        />
      )}

      {/* ---- 情勢調査モーダル ---- */}
      {showSurvey && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999,
        }}>
          <div style={{
            background: '#1e293b', color: '#f1f5f9', padding: '24px 28px',
            borderRadius: 14, maxWidth: 360, width: '90%',
            border: '1px solid #334155', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}>
            <h3 style={{ margin: '0 0 18px', color: '#f8fafc', fontSize: '1.15em' }}>📊 情勢調査</h3>
            <div style={{ marginBottom: 14 }}>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>現在の支持率</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 12, background: '#0f172a', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${Math.min(100, Math.max(0, approvalRate))}%`, height: '100%',
                    background: approvalRate >= 50 ? '#22c55e' : approvalRate >= 35 ? '#f59e0b' : '#ef4444',
                    borderRadius: 6,
                  }} />
                </div>
                <strong style={{ color: '#f8fafc', minWidth: 42, textAlign: 'right' }}>{Math.floor(approvalRate)}%</strong>
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 6 }}>一貫性スコア</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 12, background: '#0f172a', borderRadius: 6, overflow: 'hidden' }}>
                  <div style={{
                    width: `${beliefScore.consistency}%`, height: '100%',
                    background: beliefScore.consistency >= 60 ? '#22c55e' : '#f59e0b',
                    borderRadius: 6,
                  }} />
                </div>
                <strong style={{ color: '#f8fafc', minWidth: 42, textAlign: 'right' }}>{Math.floor(beliefScore.consistency)}</strong>
              </div>
            </div>
            <div style={{
              padding: '10px 14px', background: '#0f172a', borderRadius: 8,
              color: '#94a3b8', fontSize: '0.9em', lineHeight: 1.6, marginBottom: 18,
            }}>
              {approvalRate >= 60 && beliefScore.consistency >= 70
                ? '情勢は良好です。一貫した主張が有権者に届いています。'
                : approvalRate >= 50 ? '当選圏内ですが接戦です。一貫性を保って最後まで訴え続けましょう。'
                : approvalRate >= 35 ? '苦しい情勢です。一貫性が支持率に直結します。今すぐ改善を。'
                : '非常に厳しい情勢です。あきらめずに活動し、一貫した主張を続けてください。'
              }
            </div>
            <button onClick={() => setShowSurvey(false)} style={{
              width: '100%', padding: '10px 0', background: '#334155',
              color: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.95em',
            }}>閉じる</button>
          </div>
        </div>
      )}

      {/* ---- マイルストーンポップアップ ---- */}
      {milestonePopup && (
        <div className="tl-milestone-overlay" onClick={() => setMilestonePopup(null)}>
          <div className="tl-milestone-popup">
            <div className="tl-milestone-icon">🎉</div>
            <div className="tl-milestone-text">{milestonePopup}</div>
            <div className="tl-milestone-hint">タップして閉じる</div>
          </div>
        </div>
      )}

      {/* ---- ステータスミニバー（ボタン） ---- */}
      <div className="tl-statusmini">
        {playerName && <span className="tl-playername">👤 {playerName}</span>}
        <span className="tl-stat-chip">⚡ AP {fmt0(ap)}</span>
        <span className="tl-stat-chip">📅 Day {fmt0(day)}</span>
        <span className="tl-stat-chip">👥 {followers.toLocaleString()}</span>
        <span className="tl-stat-chip" style={{ color: approvalRate >= 50 ? '#22c55e' : '#ef4444' }}>
          支持率 {fmt0(approvalRate)}%
        </span>
        <button className="tl-status-btn" onClick={() => setShowStatus(true)}>📊 ステータス詳細</button>
        <button className="tl-btn-settings" onClick={() => setShowSettings(true)}>⚙️</button>
      </div>

      <div ref={electionBannerRef}>
        <ElectionBanner
          state={election}
          onJoin={handleElectionJoin}
          onLeave={handleElectionLeave}
          onOpenCounting={handleElectionCount}
          onShowSurvey={() => setShowSurvey(true)}
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
          {isPrimeMinister
            ? `総理大臣として国家を運営しよう（第${cabinetTerm}次内閣 T${cabinetTurn}/12 外交${Math.floor(diplomacyScore)} 経済${Math.floor(economyScore)} 安保${Math.floor(securityScore)} 連立${Math.floor(coalitionStability)}）`
            : isNationalMP
            ? `国会議員として実績を積もう（第${nationalTerm}期 ターン${nationalTurn}/12 実績${policyScore}pt）`
            : isCouncilor
              ? `市議会議員として成績を残し、国会議員になろう（衆議院議員選挙日まであと${Math.max(0, 49 - ((year - 1) * 12 + month))}カ月）`
              : isCleared
                ? `選挙で選ばれるように頑張ろう（選挙日まであと${TUNING.dayPerMonth - day}日）`
                : `立候補できるように頑張ろう（公示日まであと${TUNING.dayPerMonth - day}日）`
          }
        </span>
      </div>

      {/* タイムラインリスト */}
      <div className="tl-list">
        {election.phase === 'announced' && (
          <ElectionCard
            dateLabel={`Month ${election.month}, Year ${election.year}`}
            daysLeft={election.daysLeft}
            participating={election.participating}
            onJoin={handleElectionJoin}
            onShowSurvey={() => setShowSurvey(true)}
            onOpenCounting={handleElectionCount}
          />
        )}

        {events.map(ev => {
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

        {events.length === 0 && (
          <div className="tl-empty">イベントはまだありません。</div>
        )}
      </div>

      {isPrimeMinister && (
        <PrimeMinisterActions
          key={`pm-${cabinetTerm}-${cabinetTurn}`}
          cabinetTerm={cabinetTerm}
          cabinetTurn={cabinetTurn}
          coalitionStability={coalitionStability}
          diplomacyScore={diplomacyScore}
          economyScore={economyScore}
          securityScore={securityScore}
          onAction={handlePmAction}
        />
      )}

      {isNationalMP && (
        <>
          <NationalMpActions
            key={`nmp-${nationalTerm}-${nationalTurn}`}
            playerPartyId={playerPartyId}
            partyAffinity={partyAffinity}
            policyScore={policyScore}
            approvalRate={approvalRate}
            consistency={beliefScore.consistency}
            nationalTerm={nationalTerm}
            nationalTurn={nationalTurn}
            onAction={handleNmpAction}
          />
          {policyScore >= 20 && partyAffinity >= 60 && (
            <div className="tl-pmbar">
              <span>🏛️ 総裁選への出馬条件を満たしました！</span>
              <span className="pm-score-chip">実績 {policyScore}pt</span>
              <span className="pm-coalition-chip">党内支持 {Math.floor(partyAffinity)}</span>
              <div className="tl-pmbar-actions">
                <button onClick={handlePMElection} disabled={ap <= 0 || isGameOver}>
                  総裁選に出馬（AP1）
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="tl-actions">
        {isPrimeMinister ? null : isNationalMP ? null : isCouncilor ? (
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

      {(isCleared || isCouncilor) && showSnsMenu && (
        <div className="tl-sns-menu">
          <button onClick={() => addSnsPostAdvanced('youtube')} disabled={ap <= 0}>📹 YouTubeに投稿</button>
          <button onClick={() => addSnsPostAdvanced('x')}       disabled={ap <= 0}>𝕏 Xに投稿</button>
          <button className="tl-sns-cancel" onClick={() => setShowSnsMenu(false)}>キャンセル</button>
        </div>
      )}

      {isPrimeMinister ? (
        <button className="tl-nextperiod" onClick={nextCabinetTurn} disabled={ap > 0 || isGameOver}>
          {cabinetTurn >= 12
            ? `次の期へ（→ 第${cabinetTerm + 1}次内閣）`
            : `次のターンへ（T${cabinetTurn + 1} / 12）`}
        </button>
      ) : isNationalMP ? (
        <button className="tl-nextperiod" onClick={nextNationalTurn} disabled={ap > 0 || isGameOver}>
          {nationalTurn >= 12
            ? `次のターンへ（→ 衆議院選挙）`
            : `次のターンへ（ターン ${nationalTurn + 1} / 12）`}
        </button>
      ) : isCouncilor ? (
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
