
import React, { useMemo, useState } from 'react';
import './timeline.css';
import { FiZap, FiUsers, FiTwitter, FiGlobe, FiBell } from 'react-icons/fi';

import { TUNING } from './config/tuning';

import {
  initialElectionState, announceElection, joinElection, leaveElection,
  openVoting, computeResult, type ElectionState
} from './election/electionLogic.ts'; // ← パスは環境に合わせて
import ElectionBanner from './election/ElectionBanner.tsx';
import ElectionCard from './election/ElectionCard';

// 人生イベント
import { rollLifeEvent } from './life/lifeEventsLogic';
// import LifeEventCard from './life/LifeEventCard';

// クリア/ゲームオーバー
import { checkGameState } from './finish/gameState';
import FinishBanner from './finish/FinishBanner';

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

// --- 友達（NPC）関連 ---
// 友達の政治傾向（0-100）
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
    {
      id: crypto.randomUUID(),
      name: '友人A',
      conservative: randRange(30, 70),
      liberal: randRange(30, 70),
      apathetic: randRange(20, 60),
    },
    {
      id: crypto.randomUUID(),
      name: '友人B',
      conservative: randRange(30, 70),
      liberal: randRange(30, 70),
      apathetic: randRange(20, 60),
    },
    {
      id: crypto.randomUUID(),
      name: '友人C',
      conservative: randRange(30, 70),
      liberal: randRange(30, 70),
      apathetic: randRange(20, 60),
    },
  ];
}

// 54: プレイヤーステータスの型
type PlayerStatus = {
  comm: number;       // コミュ力
  credibility: number; // 信頼
  energy: number;     // 体力
};

// 58: 世論パラメータ
type PublicOpinion = {
  conservative: number; // 保守
  liberal: number;      // リベラル
  apathetic: number;    // 無関心
};

type NewsSpec = { title: string; desc: string; effect: Partial<PublicOpinion> };


// 1) フィルター型を追加（'all' + 既存カテゴリ）
type Filter = 'all' | EventCategory;

// 選択肢を as const で一元管理（タイポ防止）
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

export default function Timeline() {
    const [events, setEvents] = useState<TimelineEvent[]>(initialEvents);

    // 62: 友達リスト
    const [friends, setFriends] = useState<Friend[]>(makeInitialFriends());
    
    // 67: SNSフォロワー
    const [followers, setFollowers] = useState<number>(randRange(80, 150));


    // 55: ステータスを useState 管理（初期値は50基準）
    const [status, setStatus] = useState<PlayerStatus>({
      comm: 50,
      credibility: 50,
      energy: 80,
    });

    // 59: 世論を useState 管理（合計200目安にしてバランス取りやすく）
    const [opinion, setOpinion] = useState<PublicOpinion>({
      conservative: 70,
      liberal: 70,
      apathetic: 60,
    });

    // 2) useState の型を Filter に
    const [filter, setFilter] = useState<Filter>('all');

    // 選挙
    const [election, setElection] = useState<ElectionState>(initialElectionState());
    const filtered = useMemo(
      () => (filter === 'all' ? events : events.filter((e) => e.category === filter)),
      [events, filter]
    );

    // 3) onChange のイベント型を明示して、Filter へ安全代入
    const handleFilterChange: React.ChangeEventHandler<HTMLSelectElement> = (e) => {
      const v = e.currentTarget.value as Filter; // value は string なので Filter にキャスト
      setFilter(v);
    };

    // 汎用関数 & 日付/アクションポイント ---
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const [day, setDay] = useState<number>(1);
    const [ap, setAp] = useState<number>(3);

    // 選挙用
    const [month, setMonth] = useState<number>(1);
    const [year, setYear] = useState<number>(1);

    // ゲームオーバー/クリア
    const [isGameOver, setIsGameOver] = useState(false);
    const [isCleared, setIsCleared] = useState(false);

    const fmt0 = (n: number) => Math.round(n).toString();      // 小数点なし
//   const fmt1 = (n: number) => Number(n).toFixed(1);          // 1桁だけ見せたいとき用

    //次の日へ
    const nextDay = () => {
        if (ap > 0) return; // AP残ありなら進めない

        // 日次ノイズ（±1）
        const drift = () => (Math.random() < 0.5 ? -1 : 1);
        setOpinion((o) => ({
          conservative: clamp(o.conservative + drift(), 0, 100),
          liberal:      clamp(o.liberal      + drift(), 0, 100),
          apathetic:    clamp(o.apathetic    + drift(), 0, 100),
        }));

        // 通常ニュース（高確率）
        const spec = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
        if (Math.random() <= 0.9) {
          setOpinion((o) => ({
            conservative: clamp(o.conservative + (spec.effect.conservative ?? 0), 0, 100),
            liberal:      clamp(o.liberal      + (spec.effect.liberal ?? 0),      0, 100),
            apathetic:    clamp(o.apathetic    + (spec.effect.apathetic ?? 0),    0, 100),
          }));
          setEvents((prev) => [
            {
              id: crypto.randomUUID(),
              date: `Day ${day + 1}`,
              category: 'news',
              title: spec.title,
              description: spec.desc,
              impact: 'neutral',
              delta: {
                cons: spec.effect.conservative !== undefined ? Number((spec.effect.conservative).toFixed(1)) : undefined,
                lib:  spec.effect.liberal      !== undefined ? Number((spec.effect.liberal).toFixed(1))      : undefined,
                apa:  spec.effect.apathetic    !== undefined ? Number((spec.effect.apathetic).toFixed(1))    : undefined,
              },
            },
            ...prev,
          ]);
        }

        // ★ 月末なら「選挙公示」
        const next = day + 1;
        // const isMonthEnd = next > DAY_PER_MONTH;
        const isMonthEnd = next > TUNING.dayPerMonth;
        if (isMonthEnd) {
          // 公示状態へ
          setElection(prev => announceElection(prev, month, year));

          // タイムラインに「選挙が公示されました」を追加
          setEvents((prev) => [
            {
              id: crypto.randomUUID(),
              date: `Month ${month}, Year ${year}`,
              category: 'system',
              title: '選挙が公示されました（参加可能）',
              description: '上部のバナー、またはこのカードから参加／投票へ移動できます。',
              impact: 'neutral',
            },
            ...prev,
          ]);

          // カレンダー進行（翌月へ）
          setDay(1);
          setMonth((m) => {
            const newMonth = m === 12 ? 1 : m + 1;
            if (m === 12) setYear((y) => y + 1);
            return newMonth;
          });
        } else {
          // 月途中
          setDay(next);
        }

        // 日替わりログ（任意）
        setEvents((prev) => [
              {
                id: crypto.randomUUID(),
                date: isMonthEnd ? `Day 1 / Month ${month === 12 ? 1 : month + 1}` : `Day ${day + 1}`,
                category: 'system',
                title: '新しい一日が始まりました',
                description: '世論が日々の話題でわずかに揺れています。',
                impact: 'neutral',
              },
              ...prev,
        ]);

        // 人生イベント（10%）— 先に状態反映→次にカード追加
        if (!isGameOver && !isCleared) {
        //   if (Math.random() <= 0.10) { //本番用
          if (Math.random() <= TUNING.lifeEventProb) { //開発用
            const res = rollLifeEvent(status, opinion);
            setStatus(s => ({ ...s, ...res.status }));
            setOpinion(o => ({
              conservative: clamp((res.opinion.conservative ?? o.conservative), 0, 100),
              liberal:      clamp((res.opinion.liberal      ?? o.liberal),      0, 100),
              apathetic:    clamp((res.opinion.apathetic    ?? o.apathetic),    0, 100),
            }));
            setEvents(prev => [
              {
                id: crypto.randomUUID(),
                date: `Day ${day + 1}`,         // 翌日に起こった体で
                category: 'system',
                title: res.title,
                description: res.desc,
                impact: res.impact,
                delta: res.delta,
              },
              ...prev,
            ]);
          }
      
          // クリア/ゲームオーバー判定
          const flags = checkGameState(
            { isGameOver, isCleared: isCleared },
            status,
            opinion,
            followers
          );
          if (flags.isGameOver && !isGameOver) {
            setIsGameOver(true);
            setEvents(prev => [
              { id: crypto.randomUUID(), date: `Day ${day + 1}`, category:'system',
                title: 'ゲームオーバー', description: '条件を満たせず活動終了…。', impact:'bad' },
              ...prev,
            ]);
          } else if (flags.isCleared && !isCleared) {
            setIsCleared(true);
            setEvents(prev => [
              { id: crypto.randomUUID(), date: `Day ${day + 1}`, category:'system',
                title: 'ゲームクリア！', description: '市議選への挑戦条件を満たしました。', impact:'good' },
              ...prev,
            ]);
          }
        }

      // APリセット
      setAp(TUNING.apPerDay);
    };

        // 選挙ハンドラ
        const handleElectionJoin = () => setElection(prev => joinElection(prev));
        const handleElectionLeave = () => setElection(prev => leaveElection(prev));
        const handleElectionVote = () => {
        // phase を voting に
        setElection(prev => openVoting(prev));
        // 投票→結果計算→結果カードをタイムラインに追加
        setElection(prev => {
            const next = computeResult(prev, {
                conservative: opinion.conservative,
                liberal: opinion.liberal,
                apathetic: opinion.apathetic,
                credibility: status.credibility,
                comm: status.comm,
                followers,
            });
            if (next.lastResult) {
                const { won, turnout, voteShare } = next.lastResult;
                
                // 反動（小さく）
                setOpinion(o => ({
                  conservative: clamp(o.conservative + (won ? +1 : -1), 0, 100),
                  liberal:      clamp(o.liberal      + (won ? +1 : -1), 0, 100),
                  apathetic:    clamp(o.apathetic    + (won ? -2 : +2), 0, 100),
                }));
            
                setEvents(prevEvents => [
                  {
                    id: crypto.randomUUID(),
                    date: `Month ${month}, Year ${year}`,
                    category: 'system',
                    title: `選挙結果：${won ? '当選' : '惜敗'}`,
                    description: `投票率 ${turnout}% / 得票率 ${voteShare}%`,
                    impact: won ? 'good' : 'bad',
                    delta: { cons: won ? +1 : -1, lib: won ? +1 : -1, apa: won ? -2 : +2 }, // バッジ表示用
                  },
                  ...prevEvents,
                ]);

            }
            return next;
        });
    };

    // リセット関数
    function resetAll() {
      setEvents(initialEvents);
      setFriends(makeInitialFriends());
      setFollowers(randRange(80, 150));
      setStatus({ comm: 50, credibility: 50, energy: 80 });
      setOpinion({ conservative: 70, liberal: 70, apathetic: 60 });
      setFilter('all');
      setDay(1); setMonth(1); setYear(1);
      setAp(3);
      setElection(initialElectionState());
      setIsGameOver(false); setIsCleared(false);
    }
    // NEWS
    const NEWS_POOL: NewsSpec[] = [
      { title: '経済指標が改善',   desc: '市況がやや持ち直しムード。', effect: { conservative: +0.5, liberal: +0.5, apathetic: -0.5 } },
      { title: '物価高の懸念強まる', desc: '生活実感と政府評価にギャップ。', effect: { conservative: -0.5, liberal: +0.5, apathetic: +0.5 } },
      { title: '災害対応が迅速',     desc: '政府への信頼がわずかに上向く。', effect: { conservative: +0.8, liberal: +0.3, apathetic: -0.6 } },
      { title: '外交会談が難航',     desc: '国際関係の先行きに不安。',     effect: { conservative: -0.6, liberal: -0.6, apathetic: +0.6 } },
    ];
    function maybePushNews(prob = TUNING.newsDailyProb) {
      if (Math.random() > prob) return;
    
      const spec = NEWS_POOL[Math.floor(Math.random() * NEWS_POOL.length)];
      // 世論反映
      setOpinion((o) => ({
        conservative: clamp(o.conservative + (spec.effect.conservative ?? 0), 0, 100),
        liberal:      clamp(o.liberal      + (spec.effect.liberal ?? 0),      0, 100),
        apathetic:    clamp(o.apathetic    + (spec.effect.apathetic ?? 0),    0, 100),
      }));
      const date = `Day ${day}`; // ここは現在の day
      setEvents((prev) => [
          {
            id: crypto.randomUUID(),
            date,
            category: 'news',
            title: spec.title,
            description: spec.desc,
            impact: 'neutral',
            // 71: バッジにも差分を出す（小数1桁丸め）
            delta: {
              cons: spec.effect.conservative !== undefined ? Number((spec.effect.conservative).toFixed(1)) : undefined,
              lib:  spec.effect.liberal      !== undefined ? Number((spec.effect.liberal).toFixed(1))      : undefined,
              apa:  spec.effect.apathetic    !== undefined ? Number((spec.effect.apathetic).toFixed(1))    : undefined,
            },
          },
          ...prev,
      ]);
    }
    const addActionEvent = (type: 'vote' | 'talk' | 'post') => {
    const date = `Day ${day}`;
    if (type === 'vote') {
      const deltaApa = -3;
      // ステータス/世論の変化
      setStatus((s) => ({ ...s, credibility: Math.min(100, s.credibility + 2), energy: Math.max(0, s.energy - 5) })); // ← 追加
      setOpinion((o) => ({ ...o, apathetic: Math.max(0, o.apathetic + deltaApa) }));
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          date,
          category: 'action',
          title: '投票に行った',
          description: '自分の意思を示したことで周囲の関心がわずかに向上。',
          impact: 'good',
          delta: { apa: deltaApa },   
        },
        ...prev,
      ]);
      maybePushNews(); // 行動後に 30% でニュース発生
      setAp((x) => Math.max(0, x - 1)); //AP消費
    } else if (type === 'talk') {
      // 選択UIで先頭の友達が「話す相手」
      const target = friends[0] ?? friends[Math.floor(Math.random() * friends.length)];
      if (!target) return;

      // 変化量（±1 or ±2）／無関心は下がりやすい
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

      // 友達リストを更新
      setFriends(prev => prev.map(f => (f.id === target.id ? updated : f)));

      // 世論への伝播（係数0.2）
      const spread = 0.2;
      setOpinion(o => ({
        conservative: Math.max(0, Math.min(100, o.conservative + spread * deltaCons)),
        liberal:      Math.max(0, Math.min(100, o.liberal      + spread * deltaLib)),
        apathetic:    Math.max(0, Math.min(100, o.apathetic    + spread * deltaApa)),
      }));

      // ステータス
      setStatus((s) => ({ ...s, comm: Math.min(100, s.comm + 3), energy: Math.max(0, s.energy - 3) })); // ← 追加
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          date,
          category: 'friend',
          title: '友達と話した',
          description: '友達の政治傾向が少し変化。世論にも微細な波紋。',
          impact: 'neutral',
          delta: { cons: deltaCons, lib: deltaLib, apa: deltaApa },
        },
        ...prev,
      ]);
      maybePushNews(); // 行動後に 30% でニュース発生
      setAp((x) => Math.max(0, x - 1)); //AP消費
    } else {
    //   const bad = Math.random() < 0.15;
      const bad = Math.random() < TUNING.rageRate.normal;

      // フォロワー増減（-5〜-30 / +10〜+40）
      const deltaFollowers = bad
        ? - (5 + Math.floor(Math.random() * 26))
        :   (10 + Math.floor(Math.random() * 31));
      setFollowers(n => Math.max(0, n + deltaFollowers));

      // 影響倍率（1.0 + followers * 0.0005, 上限2.5）
    //   const influenceMul = Math.min(2.5, 1.0 + (followers * 0.0005));
      const influenceMul = Math.min(TUNING.snsInfluenceCap, 1.0 + followers * TUNING.snsInfluenceCoeff);

      // 世論へ反映（倍率込）
      setOpinion((o) => ({
        conservative: Math.max(0, Math.min(100, o.conservative + (bad ? 0.5 : 0)   * influenceMul)),
        liberal:      Math.max(0, Math.min(100, o.liberal      + (bad ? -0.5 : 1) * influenceMul)),
        apathetic:    Math.max(0, Math.min(100, o.apathetic    + (bad ? 1 : -0.5) * influenceMul)),
      }));

      // ステータス
      setStatus((s) => ({
        ...s,
        comm: Math.min(100, s.comm + (bad ? -2 : 2)),
        credibility: Math.min(100, Math.max(0, s.credibility + (bad ? -4 : 1))),
        energy: Math.max(0, s.energy - 2),
      }));

      // ログ（先頭）
      setEvents((prev) => [
        {
          id: crypto.randomUUID(),
          date,
          category: 'sns',
          title: 'SNSに投稿した',
          description: bad
            ? '炎上。フォロワーが減少し、信頼低下・関心後退。'
            : '反響あり。フォロワーが増加し、関心が少し高まった。',
          impact: bad ? 'bad' : 'good',
          delta: { followers: deltaFollowers },
        },
        ...prev,
      ]);
      maybePushNews(); // 行動後に 30% でニュース発生
      setAp((x) => Math.max(0, x - 1)); //AP消費
    }
  };

    // ▼ 1) セーブ用の型とキー
    type SaveState = {
      events: TimelineEvent[];
      friends: Friend[];
      followers: number;
      status: PlayerStatus;
      opinion: PublicOpinion;
      filter: Filter;
      day: number; month: number; year: number;
      ap: number;
      election: ElectionState;
      isGameOver: boolean; isCleared: boolean;
    };
    const SAVE_KEY = 'politics-sim-save-v1';

    // ▼ 2) セーブ/ロード関数
    function saveGame() {
      const data: SaveState = {
        events, friends, followers, status, opinion, filter,
        day, month, year, ap, election, isGameOver, isCleared
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
      } catch {}
    }

    // ▼ 3) 自動セーブ（主要stateが変わるたび）
    React.useEffect(() => {
      saveGame();
    }, [events, status, opinion, followers, day, month, year, ap, election, isGameOver, isCleared]);

    // ▼ 4) 初回ロード
    React.useEffect(() => {
      loadGame();
    }, []);

  return (
    <div className="tl-container">
    {/* ステータスバー */}
      <div className="tl-statusbar">
        <div className="tl-stat">
          <span>コミュ力</span><strong>{fmt0(status.comm)}</strong>
        </div>
        <div className="tl-stat">
          <span>信頼</span><strong>{fmt0(status.credibility)}</strong>
        </div>
        <div className="tl-stat">
          <span>体力</span><strong>{fmt0(status.energy)}</strong>
        </div>
        <div className="tl-divider" />
        <div className="tl-stat">
          <span>保守</span><strong>{fmt0(opinion.conservative)}</strong>
        </div>
        <div className="tl-stat">
          <span>リベラル</span><strong>{fmt0(opinion.liberal)}</strong>
        </div>
        <div className="tl-stat">
          <span>無関心</span><strong>{fmt0(opinion.apathetic)}</strong>
        </div>
        <div className="tl-stat"><span>Day</span><strong>{fmt0(day)}</strong></div>
        <div className="tl-stat"><span>AP</span><strong>{fmt0(ap)}</strong></div>
      </div>
        <ElectionBanner
          state={election}
          onJoin={handleElectionJoin}
          onLeave={handleElectionLeave}
          onOpenVoting={handleElectionVote}
        />
        
        <FinishBanner
          cleared={isCleared}
          over={isGameOver}
          onReset={resetAll}
        />

        <div className="tl-help">
          <ol>
            <li>1日あたり AP=3。行動ボタンで世論/ステータスが動きます。</li>
            <li>月末に選挙が公示。バナーやカードから参加→投票できます。</li>
            <li>クリア：信頼80・コミュ70・フォロワー1000・無関心40以下。</li>
          </ol>
        </div>

        <div className="tl-savebar">
          <button onClick={saveGame}>セーブ</button>
          <button onClick={loadGame}>ロード</button>
          <button onClick={resetAll}>新規開始</button>
        </div>

      {/* ヘッダー / フィルター */}
      <div className="tl-header">
        <h2 className="tl-title">タイムライン</h2>
        <div className="tl-filter">
          <label>カテゴリ:</label>
          <select value={filter} onChange={handleFilterChange}>
            {FILTER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === 'all'
                  ? 'すべて'
                  : opt === 'news'
                  ? 'ニュース'
                  : opt === 'sns'
                  ? 'SNS'
                  : opt === 'friend'
                  ? '友人'
                  : opt === 'action'
                  ? '行動'
                  : 'システム'}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 友達選択（簡易） */}
      <div className="tl-friendsbar">
        <span>話す相手：</span>
        <select
          value={friends[0]?.id ?? ''}
          onChange={(e) => {
            // 1人目に選んだ友達を前に寄せる簡易の実装（最前にいる相手が「既定」扱い）
            const id = e.currentTarget.value;
            setFriends((prev) => {
              const idx = prev.findIndex((f) => f.id === id);
              if (idx <= 0) return prev;
              const copy = [...prev];
              const [picked] = copy.splice(idx, 1);
              return [picked, ...copy];
            });
          }}
        >
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}（保:{f.conservative}／リ:{f.liberal}／無:{f.apathetic}）
            </option>
          ))}
        </select>
        <span className="tl-followers">フォロワー {followers}</span>
      </div>


      {/* 73: スクロール領域 */}
      <div className="tl-list">
        {election.phase === 'announced' && (
          <ElectionCard
            dateLabel={`Month ${election.month}, Year ${election.year}`}
            onJoin={handleElectionJoin}
            onOpenVoting={handleElectionVote}
          />
        )}

        {filtered.map((ev) => {
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
                  <span className="tl-cat" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                  <span
                    className="tl-badge"
                    style={{ backgroundColor: impactColor[ev.impact] }}
                    title={`影響度: ${impactLabel[ev.impact]}`}
                  >
                    {impactLabel[ev.impact]}
                    {ev.delta?.cons ? ` 保${ev.delta.cons > 0 ? '+' : ''}${ev.delta.cons}` : ''}
                    {ev.delta?.lib ? ` リ${ev.delta.lib > 0 ? '+' : ''}${ev.delta.lib}` : ''}
                    {ev.delta?.apa ? ` 無${ev.delta.apa > 0 ? '+' : ''}${ev.delta.apa}` : ''}
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

        {/* 50〜53: 行動ボタン（仮） */}
        <div className="tl-actions">
            <button onClick={() => addActionEvent('vote')} disabled={ap<=0 || isGameOver || isCleared}>投票に行く</button>
            <button onClick={() => addActionEvent('talk')} disabled={ap<=0 || isGameOver || isCleared}>友達と話す</button>
            <button onClick={() => addActionEvent('post')} disabled={ap<=0 || isGameOver || isCleared}>SNSに投稿</button>
        </div>
         <button className="tl-nextday" onClick={nextDay} disabled={ap>0 || isGameOver || isCleared}>
           次の日へ（Day {day + 1}）
         </button>

    </div>
  );
}