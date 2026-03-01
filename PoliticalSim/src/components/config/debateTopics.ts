// ====== 討論バトル：議題・相手キャラクターデータ ======

export type DebateCategoryId =
  | 'economy' | 'diplomacy' | 'environment' | 'welfare'
  | 'education' | 'security' | 'tech' | 'local';

export const CATEGORY_LABELS: Record<DebateCategoryId, string> = {
  economy:     '経済',
  diplomacy:   '外交',
  environment: '環境',
  welfare:     '社会保障',
  education:   '教育',
  security:    '安全保障',
  tech:        'テクノロジー',
  local:       '地方自治',
};

export type DebateChoiceEffect = {
  playerHPDelta:     number; // 正=回復, 負=ダメージ
  opponentHPDelta:   number; // 負=相手にダメージ, 正=相手回復
  conservativeDelta: number; // プレイヤー保守度変化 (lib = 100 - cons)
  consistencyDelta:  number;
  approvalDelta:     number; // 世論への直接影響
  message:           string;
};

export type DebateChoice = {
  label:  string;
  effect: DebateChoiceEffect;
};

export type DebateRound = {
  opponentText: string;
  type:         'question' | 'statement';
  choices:      DebateChoice[];
};

export type DebateTheme = {
  theme:            string;
  category:         DebateCategoryId;
  opponentOpening:  string;
  rounds:           DebateRound[];
};

export type OpponentIdeology = 'conservative' | 'liberal' | 'nationalist' | 'progressive' | 'centrist';

export type DebateOpponent = {
  name:                string;
  party:               string;
  ideology:            OpponentIdeology;
  icon:                string;
  preferredCategories: DebateCategoryId[];
};

// ---- 討論相手キャラクター ----
export const DEBATE_OPPONENTS: DebateOpponent[] = [
  {
    name: '田中 保一',
    party: '守旧派連合',
    ideology: 'conservative',
    icon: '👔',
    preferredCategories: ['security', 'economy', 'local'],
  },
  {
    name: '大木 香澄',
    party: '進歩民主連合',
    ideology: 'liberal',
    icon: '🌸',
    preferredCategories: ['environment', 'welfare', 'education'],
  },
  {
    name: '鈴木 一郎',
    party: '国民連合',
    ideology: 'nationalist',
    icon: '🎌',
    preferredCategories: ['diplomacy', 'economy', 'local'],
  },
  {
    name: '山村 翔子',
    party: '未来共創党',
    ideology: 'progressive',
    icon: '🚀',
    preferredCategories: ['tech', 'environment', 'education'],
  },
];

// ---- 議題データ ----
export const DEBATE_THEMES: DebateTheme[] = [
  // ===== 経済 =====
  {
    theme: '消費税の引き上げ',
    category: 'economy',
    opponentOpening: '「財政再建のためには、消費税のさらなる引き上げが必要です。あなたはどうお考えですか？」',
    rounds: [
      {
        type: 'question',
        opponentText: '「財政赤字が深刻です。消費税を12%に引き上げるべきだと思いませんか？」',
        choices: [
          { label: '賛成：財政再建は急務だ', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +5, consistencyDelta: +2, approvalDelta: +1, message: '保守支持層に評価される回答をした。' } },
          { label: '反対：景気回復が先決だ', effect: { playerHPDelta: -5, opponentHPDelta: -20, conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2, message: '積極財政派にアピール。相手のHPを大きく削った。' } },
          { label: '中立：丁寧な議論が必要', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: '穏健な回答。大きな変動なし。' } },
          { label: 'かわす：論点をずらす', effect: { playerHPDelta: +5, opponentHPDelta: -5, conservativeDelta: 0, consistencyDelta: -5, approvalDelta: -1, message: '論点をずらした。一貫性が下がる。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「軽減税率の導入で低所得者への影響は最小化できます。財政規律こそ重要です。」',
        choices: [
          { label: '賛成：その通りだ', effect: { playerHPDelta: -10, opponentHPDelta: 0, conservativeDelta: +8, consistencyDelta: -3, approvalDelta: -2, message: '相手の主張に同意。保守寄りになった。' } },
          { label: '反対：軽減税率は不十分だ', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2, message: '強く反論した。相手に大きなダメージ。' } },
          { label: '中立：一面では正しい', effect: { playerHPDelta: 0, opponentHPDelta: -8, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: 'バランスの取れた回答。' } },
          { label: 'かわす：別の財源を提案する', effect: { playerHPDelta: +8, opponentHPDelta: -12, conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +1, message: '代替案を提示。場の流れを変えた。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「増税なき財政再建は可能だとお考えですか？」',
        choices: [
          { label: '可能だ：歳出削減で対応する', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +5, consistencyDelta: +3, approvalDelta: +1, message: '小さな政府路線を示した。' } },
          { label: '不可能：成長戦略で税収増を', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -3, consistencyDelta: +4, approvalDelta: +3, message: '積極的な成長戦略を打ち出した。' } },
          { label: '一概には言えない', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: 0, approvalDelta: 0, message: '曖昧な回答に終わった。' } },
          { label: 'かわす：景気対策が優先', effect: { playerHPDelta: +3, opponentHPDelta: -8, conservativeDelta: 0, consistencyDelta: -3, approvalDelta: 0, message: '話題を変えた。一貫性が下がる。' } },
        ],
      },
    ],
  },
  {
    theme: '最低賃金の引き上げ',
    category: 'economy',
    opponentOpening: '「中小企業への影響を考えると、最低賃金の急速な引き上げは危険です。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「最低賃金を急速に引き上げれば中小企業が倒産する。慎重な対応が必要だ。」',
        choices: [
          { label: '賛成：段階的な引き上げを支持', effect: { playerHPDelta: -5, opponentHPDelta: -10, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: 0, message: '中道的な立場を示した。' } },
          { label: '反対：労働者の生活を守れ', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +3, message: 'リベラル層から支持を得た。' } },
          { label: '中立：データで判断すべき', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1, message: '客観的な姿勢を示した。' } },
          { label: 'かわす：同一労働同一賃金が重要', effect: { playerHPDelta: +5, opponentHPDelta: -15, conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +2, message: '別の政策論点を提示した。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「補助金なしに最低賃金を上げたら何が起きると思いますか？」',
        choices: [
          { label: '雇用が減り失業が増える', effect: { playerHPDelta: -5, opponentHPDelta: -15, conservativeDelta: +5, consistencyDelta: +3, approvalDelta: -1, message: '経済合理性に基づいた回答。' } },
          { label: '消費が増え景気が良くなる', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -5, consistencyDelta: +2, approvalDelta: +2, message: '積極的な経済効果を主張した。' } },
          { label: '経営者が工夫するはずだ', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: '起業家精神に期待する回答。' } },
          { label: 'かわす：国際比較で考えるべき', effect: { playerHPDelta: +3, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0, message: '議論をかわした。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「欧米の最低賃金引き上げは失敗例も多い。アルメリアの実情に合わせるべきだ。」',
        choices: [
          { label: '賛成：国情に合わせるべきだ', effect: { playerHPDelta: -10, opponentHPDelta: 0, conservativeDelta: +5, consistencyDelta: -2, approvalDelta: -1, message: '相手に有利な展開になった。' } },
          { label: '反対：成功例から学ぶべきだ', effect: { playerHPDelta: +5, opponentHPDelta: -22, conservativeDelta: -5, consistencyDelta: +4, approvalDelta: +3, message: '力強い反論で相手を圧倒。' } },
          { label: '中立：失敗例と成功例両方ある', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1, message: '冷静なデータ提示。' } },
          { label: 'かわす：政策立案者の責任だ', effect: { playerHPDelta: +3, opponentHPDelta: -8, conservativeDelta: 0, consistencyDelta: -3, approvalDelta: 0, message: '責任論に転換した。' } },
        ],
      },
    ],
  },
  // ===== 外交 =====
  {
    theme: '近隣国との関係',
    category: 'diplomacy',
    opponentOpening: '「オルメン帝国との関係について、はっきりした立場を示してほしい。」',
    rounds: [
      {
        type: 'question',
        opponentText: '「オルメン帝国との対話を優先すべきか、圧力をかけるべきか？」',
        choices: [
          { label: '対話を優先：外交で解決する', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +2, message: 'リベラル外交路線を示した。' } },
          { label: '圧力が必要：強い姿勢で交渉', effect: { playerHPDelta: 0, opponentHPDelta: -18, conservativeDelta: +8, consistencyDelta: +3, approvalDelta: +1, message: '強硬な外交姿勢を示した。' } },
          { label: '中立：状況次第で使い分ける', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: '柔軟な外交観を示した。' } },
          { label: 'かわす：多国間での協調が重要', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +1, message: '多国間主義を提唱した。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「領土問題は絶対に譲歩できない。国家の尊厳の問題だ。」',
        choices: [
          { label: '賛成：国家主権は絶対だ', effect: { playerHPDelta: -5, opponentHPDelta: -10, conservativeDelta: +10, consistencyDelta: -2, approvalDelta: 0, message: 'ナショナリスト的な立場を示した。' } },
          { label: '反対：柔軟な解決策も検討を', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +2, message: '現実的な外交を提唱した。' } },
          { label: '中立：歴史的経緯を踏まえて', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1, message: '歴史的文脈を重視した回答。' } },
          { label: 'かわす：経済関係の改善を先に', effect: { playerHPDelta: +8, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -3, approvalDelta: 0, message: '実利的なアプローチを提案した。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「国際機関への依存を減らし、自国で問題解決すべきでは？」',
        choices: [
          { label: '賛成：自国の利益を最優先に', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +8, consistencyDelta: +2, approvalDelta: 0, message: '自国優先主義を示した。' } },
          { label: '反対：国際協調が唯一の道', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +2, message: '国際主義的な立場を強調した。' } },
          { label: '中立：バランスが大切だ', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: '中道的な外交観。' } },
          { label: 'かわす：まず国内問題を解決して', effect: { playerHPDelta: +3, opponentHPDelta: -8, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: -1, message: '内政優先論に転換した。' } },
        ],
      },
    ],
  },
  // ===== 環境 =====
  {
    theme: '脱炭素政策',
    category: 'environment',
    opponentOpening: '「2030年のCO2削減目標は現実的ではありません。経済への影響を無視している。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「CO2削減のために産業を犠牲にすることは間違っています。経済成長との両立が必要です。」',
        choices: [
          { label: '賛成：経済と環境を両立する', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: +3, consistencyDelta: 0, approvalDelta: +1, message: '現実的な環境政策を示した。' } },
          { label: '反対：今すぐ脱炭素を進める', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +3, message: '環境優先の姿勢を示した。' } },
          { label: '中立：段階的なアプローチが現実的', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1, message: '穏健な環境政策を提案した。' } },
          { label: 'かわす：技術革新に期待したい', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0, message: '技術革新頼みの回答をした。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「再生可能エネルギーの普及で電気代が上がっても受け入れられますか？」',
        choices: [
          { label: '受け入れる：未来への投資だ', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2, message: '環境重視の有権者に評価される。' } },
          { label: '受け入れない：家計への影響が大きい', effect: { playerHPDelta: -5, opponentHPDelta: -12, conservativeDelta: +5, consistencyDelta: +2, approvalDelta: -1, message: '家計を重視した現実的な回答。' } },
          { label: '補助制度で緩和すべき', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, message: '福祉的なアプローチで評価された。' } },
          { label: 'かわす：まず節電から始める', effect: { playerHPDelta: +3, opponentHPDelta: -8, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0, message: '小さい提案で議論をかわした。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「原子力発電の活用は脱炭素に有効だと思いますか？」',
        choices: [
          { label: '有効だ：安全前提で推進する', effect: { playerHPDelta: 0, opponentHPDelta: -20, conservativeDelta: +5, consistencyDelta: +3, approvalDelta: 0, message: '原発推進派を取り込んだ。' } },
          { label: '反対：リスクが大きすぎる', effect: { playerHPDelta: +5, opponentHPDelta: -15, conservativeDelta: -5, consistencyDelta: +2, approvalDelta: +2, message: '脱原発派の支持を得た。' } },
          { label: '中立：慎重に検討すべき課題', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1, message: 'バランスの取れた回答。' } },
          { label: 'かわす：次世代エネルギーを開発する', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +1, message: '技術革新路線を提示した。' } },
        ],
      },
    ],
  },
  // ===== 社会保障 =====
  {
    theme: '社会保障の持続可能性',
    category: 'welfare',
    opponentOpening: '「現在の社会保障制度はあと10年も続かない。抜本的な改革が必要です。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「年金制度の抜本改革なしには若者世代が損をするだけです。」',
        choices: [
          { label: '賛成：年金改革が急務だ', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: -3, consistencyDelta: +3, approvalDelta: +2, message: '若者世代の支持を得た。' } },
          { label: '反対：高齢者の安心も守れ', effect: { playerHPDelta: -5, opponentHPDelta: -12, conservativeDelta: +5, consistencyDelta: +1, approvalDelta: -1, message: '高齢者層にも配慮した立場。' } },
          { label: '中立：全世代が等しく負担する', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1, message: '公平負担論を展開した。' } },
          { label: 'かわす：まず経済成長が先決', effect: { playerHPDelta: +5, opponentHPDelta: -8, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: 0, message: '成長論にすり替えた。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「ベーシックインカムの導入は実現可能だと思いますか？」',
        choices: [
          { label: '実現可能：将来的に導入すべき', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +3, message: '大胆な社会政策を提唱した。' } },
          { label: '不可能：財源が確保できない', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0, message: '財政の現実を直視した回答。' } },
          { label: 'まず試験的導入から始める', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, message: '慎重だが前向きな姿勢を示した。' } },
          { label: 'かわす：既存の生活保護の拡充が先', effect: { playerHPDelta: +3, opponentHPDelta: -10, conservativeDelta: -3, consistencyDelta: -2, approvalDelta: +1, message: '既存制度の活用を提案した。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「自己責任論が強すぎる。セーフティネットの充実こそ社会の安定をもたらす。」',
        choices: [
          { label: '賛成：社会が支え合うべきだ', effect: { playerHPDelta: -5, opponentHPDelta: -5, conservativeDelta: -8, consistencyDelta: -3, approvalDelta: +2, message: '相手に同意したが一貫性が下がった。' } },
          { label: '反対：自己責任と公助のバランスが重要', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: +5, consistencyDelta: +3, approvalDelta: +1, message: '中道的な立場で反論した。' } },
          { label: '中立：どちらも必要だ', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1, message: 'バランスを保った回答。' } },
          { label: 'かわす：コミュニティの力を活かす', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: +1, message: 'コミュニティ論で話題を転換した。' } },
        ],
      },
    ],
  },
  // ===== 安全保障 =====
  {
    theme: '防衛費の増額',
    category: 'security',
    opponentOpening: '「近隣諸国の軍拡に対応するために防衛費の増額は不可欠です。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「防衛費をGDP比2%に引き上げることで抑止力が高まります。」',
        choices: [
          { label: '賛成：安全保障は最優先事項', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +8, consistencyDelta: +3, approvalDelta: +1, message: '保守層に強くアピールした。' } },
          { label: '反対：外交で平和を守る', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +2, message: '平和主義的な立場を明確にした。' } },
          { label: '中立：慎重な議論が必要', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: '穏健な立場を示した。' } },
          { label: 'かわす：防衛より外交官を増やす', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: -3, consistencyDelta: -2, approvalDelta: +1, message: '外交力強化を提唱した。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「集団的自衛権の行使に賛成ですか？」',
        choices: [
          { label: '賛成：同盟国を守ることが重要', effect: { playerHPDelta: 0, opponentHPDelta: -18, conservativeDelta: +8, consistencyDelta: +3, approvalDelta: 0, message: '同盟重視の姿勢を示した。' } },
          { label: '反対：専守防衛が原則だ', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +2, message: '憲法の精神を守る立場を示した。' } },
          { label: '限定的に認める', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +1, message: '現実的な中道的立場。' } },
          { label: 'かわす：憲法解釈は慎重に', effect: { playerHPDelta: +3, opponentHPDelta: -8, conservativeDelta: 0, consistencyDelta: -3, approvalDelta: 0, message: '法的論点に転換した。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「平和を守るための力の行使は時に必要です。理想論だけでは国を守れない。」',
        choices: [
          { label: '賛成：現実主義の立場から', effect: { playerHPDelta: -5, opponentHPDelta: -8, conservativeDelta: +5, consistencyDelta: -2, approvalDelta: 0, message: '現実主義的な安全保障観を示した。' } },
          { label: '反対：対話こそが最強の防衛', effect: { playerHPDelta: +8, opponentHPDelta: -20, conservativeDelta: -8, consistencyDelta: +4, approvalDelta: +3, message: '外交優先の立場で強く反論した。' } },
          { label: '中立：状況によって判断が必要', effect: { playerHPDelta: 0, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1, message: '柔軟な安全保障観を示した。' } },
          { label: 'かわす：軍縮交渉を主導すべき', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: -5, consistencyDelta: -2, approvalDelta: +1, message: '軍縮路線を提唱した。' } },
        ],
      },
    ],
  },
  // ===== 教育 =====
  {
    theme: '教育無償化の範囲',
    category: 'education',
    opponentOpening: '「大学無償化は財源の問題から現実的ではないと考えています。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「大学まで完全無償化したら財政が破綻します。本当に必要な人だけ支援すべきです。」',
        choices: [
          { label: '賛成：所得制限付き支援が現実的', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: +3, consistencyDelta: +2, approvalDelta: 0, message: '財政規律を重視した立場。' } },
          { label: '反対：教育は社会への投資だ', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +3, message: '教育無償化の理念を訴えた。' } },
          { label: '中立：段階的な無償化を進める', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +2, message: '現実的な段階論を示した。' } },
          { label: 'かわす：奨学金制度の充実が先', effect: { playerHPDelta: +3, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +1, message: '現行制度の改善を提案した。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「私立学校への公的資金投入についてはどうお考えですか？」',
        choices: [
          { label: '賛成：教育の多様性を守る', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0, message: '教育の多様性を支持した。' } },
          { label: '反対：公立教育を充実させる', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2, message: '公教育重視の立場を示した。' } },
          { label: '条件付きで支援する', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: +2, consistencyDelta: +2, approvalDelta: +1, message: '条件付き支援という中道的立場。' } },
          { label: 'かわす：教員の待遇改善が最優先', effect: { playerHPDelta: +5, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +1, message: '教員問題に話題を転換した。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「英語教育よりも、まず国語力・論理的思考力の育成が大切です。」',
        choices: [
          { label: '賛成：基礎学力が重要だ', effect: { playerHPDelta: -5, opponentHPDelta: -8, conservativeDelta: +5, consistencyDelta: -2, approvalDelta: 0, message: '伝統的な教育観を示した。' } },
          { label: '反対：グローバル教育は必須だ', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2, message: 'グローバル人材育成を主張した。' } },
          { label: '両立が必要だ', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, message: '包括的な教育観を示した。' } },
          { label: 'かわす：IT教育こそが急務', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +1, message: 'デジタル教育に転換した。' } },
        ],
      },
    ],
  },
  // ===== テクノロジー =====
  {
    theme: 'AI規制と技術革新',
    category: 'tech',
    opponentOpening: '「AI技術の規制なき普及は社会に重大なリスクをもたらします。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「AIによる雇用喪失への対策なしに、AI技術を野放図に普及させるべきではありません。」',
        choices: [
          { label: '賛成：規制と支援策が必要', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +2, message: '規制論を展開した。' } },
          { label: '反対：技術革新を阻害してはいけない', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: 0, consistencyDelta: +3, approvalDelta: +1, message: '技術推進派の支持を得た。' } },
          { label: '中立：段階的な規制と普及を', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, message: 'バランスの取れた政策論。' } },
          { label: 'かわす：教育で対応できる', effect: { playerHPDelta: +3, opponentHPDelta: -8, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0, message: '教育論にすり替えた。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「AI生成コンテンツに著作権を認めるべきですか？」',
        choices: [
          { label: '認める：AIを創作者として扱う', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: 0, message: 'AI権利論を展開した。' } },
          { label: '認めない：人間の創作を守る', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: +3, consistencyDelta: +3, approvalDelta: +2, message: 'クリエイターの権利を守る姿勢を示した。' } },
          { label: '新たな法律で整備すべき', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, message: '法整備論を展開した。' } },
          { label: 'かわす：国際的なルール作りが先', effect: { playerHPDelta: +5, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +1, message: '国際協調を求める立場。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「デジタル監視社会のリスクより、利便性向上のためにデータ活用を優先すべきです。」',
        choices: [
          { label: '賛成：プライバシーより利便性を', effect: { playerHPDelta: -5, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0, message: '効率優先の立場を示した。' } },
          { label: '反対：プライバシーは基本的人権', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: -5, consistencyDelta: +4, approvalDelta: +3, message: '人権重視の立場で強く反論した。' } },
          { label: 'バランスが必要：本人同意を前提に', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, message: '中道的なデータ政策論。' } },
          { label: 'かわす：サイバーセキュリティが先決', effect: { playerHPDelta: +5, opponentHPDelta: -10, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: 0, message: 'セキュリティ論に転換した。' } },
        ],
      },
    ],
  },
  // ===== 地方自治 =====
  {
    theme: '地方創生と移住促進',
    category: 'local',
    opponentOpening: '「地方の過疎化に対応するには、都市への集約が効率的だと考えています。」',
    rounds: [
      {
        type: 'statement',
        opponentText: '「小さな村を無理に維持するより、都市部に人口を集中させた方が効率的です。」',
        choices: [
          { label: '賛成：都市集中が現実的', effect: { playerHPDelta: -5, opponentHPDelta: -10, conservativeDelta: 0, consistencyDelta: -2, approvalDelta: -2, message: '地方切り捨て論という批判を受けた。' } },
          { label: '反対：地方の文化と産業を守る', effect: { playerHPDelta: +5, opponentHPDelta: -20, conservativeDelta: +5, consistencyDelta: +3, approvalDelta: +3, message: '地方重視の姿勢が評価された。' } },
          { label: '中立：地方の実情に応じた対応を', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1, message: '柔軟な地方政策論。' } },
          { label: 'かわす：テレワーク推進で解決できる', effect: { playerHPDelta: +5, opponentHPDelta: -12, conservativeDelta: -3, consistencyDelta: -2, approvalDelta: +1, message: 'テレワーク活用論を提案した。' } },
        ],
      },
      {
        type: 'question',
        opponentText: '「地方交付税を削減して地方自治体の自立を促すべきでは？」',
        choices: [
          { label: '賛成：自立できる地域を増やす', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +5, consistencyDelta: +2, approvalDelta: -1, message: '行財政改革論を示した。' } },
          { label: '反対：格差が拡大する', effect: { playerHPDelta: +5, opponentHPDelta: -18, conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2, message: '地方格差の解消を訴えた。' } },
          { label: '段階的に検討する', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, message: '慎重な立場を示した。' } },
          { label: 'かわす：道州制の導入を検討すべき', effect: { playerHPDelta: +5, opponentHPDelta: -10, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: 0, message: '広域行政論に転換した。' } },
        ],
      },
      {
        type: 'statement',
        opponentText: '「移民受け入れで地方の人手不足を解消するのが現実的です。」',
        choices: [
          { label: '賛成：多様性が地方を活性化する', effect: { playerHPDelta: +5, opponentHPDelta: -15, conservativeDelta: -8, consistencyDelta: +3, approvalDelta: +2, message: '国際的な視点を示した。' } },
          { label: '反対：地域文化への影響が心配', effect: { playerHPDelta: 0, opponentHPDelta: -15, conservativeDelta: +8, consistencyDelta: +2, approvalDelta: 0, message: '文化保護論を展開した。' } },
          { label: '条件付きで受け入れる', effect: { playerHPDelta: 0, opponentHPDelta: -12, conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +1, message: '現実的な移民政策論。' } },
          { label: 'かわす：若者の地方移住促進が先', effect: { playerHPDelta: +5, opponentHPDelta: -10, conservativeDelta: +3, consistencyDelta: -2, approvalDelta: +1, message: '国内移住促進論に転換した。' } },
        ],
      },
    ],
  },
];

export function getDebateThemeForOpponent(opponent: DebateOpponent): DebateTheme {
  const preferred = DEBATE_THEMES.filter(t => opponent.preferredCategories.includes(t.category));
  const pool = preferred.length > 0 ? preferred : DEBATE_THEMES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function getRandomOpponent(): DebateOpponent {
  return DEBATE_OPPONENTS[Math.floor(Math.random() * DEBATE_OPPONENTS.length)];
}
