// ====== 友達会話システム：固定キャラクターデータ ======

export type IdeologyType =
  | '保守'
  | 'リベラル'
  | 'グローバル推進'
  | 'グローバル抑制'
  | '積極財政'
  | '消極財政'
  | '大きい政府'
  | '小さい政府'
  | '政治に興味がない'
  | 'ナショナリスト'
  | '環境重視派'
  | '社会保障重視派'
  | '経済成長最優先派'
  | 'ポピュリスト'
  | '陰謀論寄り';

export type FriendEffect = {
  conservativeDelta: number; // player conservative stance change
  consistencyDelta:  number;
  approvalDelta:     number;
  commDelta?:        number;
};

export type FriendChoice = {
  label:       string;
  charResponse: string;
  effect:      FriendEffect;
};

export type FriendExchange = {
  charText:      string;
  type:          'charSpeaks' | 'playerAsks'; // playerAsks = player initiates
  isSpecial?:    boolean;                      // 政治無関心の特殊フロー
  choices:       FriendChoice[];
};

export type FriendChar = {
  id:          string;
  name:        string;
  icon:        string;
  gender:      'male' | 'female';
  ideologyType: IdeologyType;
  opening:     string; // first line when selected
  exchanges:   FriendExchange[]; // 3 exchanges
};

export const FRIEND_CHARS: FriendChar[] = [
  // ===== 1. 保守 (古風) =====
  {
    id: 'fc_01',
    name: '田村 義雄',
    icon: '👴',
    gender: 'male',
    ideologyType: '保守',
    opening: '最近の若いもんは礼儀も知らんな。やっぱり伝統を大切にせんとあかん。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「戦後の価値観がこの国をダメにしたと思わんか？昔ながらの家族の形が一番大事やで。」',
        choices: [
          { label: '賛成：伝統的な価値観は大切だ', charResponse: '「わかっとるやないか！そういう話ができる若者は貴重やで。」', effect: { conservativeDelta: +8, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '反対：多様な家族の形を認めるべき', charResponse: '「うーん、そうか…まあ時代が変わったのも事実やな。」', effect: { conservativeDelta: -6, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '中立：どちらも大切な部分がある', charResponse: '「まあ、バランスが大事というのは分かる。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0 } },
          { label: 'かわす：政治の話はちょっと…', charResponse: '「なんや、ハッキリせんなあ。まあええけど。」', effect: { conservativeDelta: 0, consistencyDelta: -3, approvalDelta: -1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「隣国との外交は毅然とした態度で臨まないとなめられる。強い国でなければならん。」',
        choices: [
          { label: '賛成：強い外交姿勢が必要だ', charResponse: '「そうや！その意気や。国防をしっかりせんとな。」', effect: { conservativeDelta: +6, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '反対：対話と協調外交が重要だ', charResponse: '「甘いな…でも対話も必要とは思うが。」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '中立：強さと対話の両方が必要', charResponse: '「まあ、それが現実的かもしれんな。」', effect: { conservativeDelta: +2, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：経済関係の方が大事では', charResponse: '「経済は大事やが、安全保障あっての経済やで。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「今の政治家はポピュリズムに走りすぎや。長期的なビジョンを持つ指導者が必要やな。」',
        choices: [
          { label: '賛成：強いリーダーシップが必要だ', charResponse: '「そや！そういう政治家を見つけていかんとな。」', effect: { conservativeDelta: +5, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '反対：民主主義は民意を反映すべき', charResponse: '「そうも言えるな。難しいもんや、政治は。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '中立：バランスが大事だと思う', charResponse: '「まあ、そうやな。中道も大事やな。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：若い政治家に期待したい', charResponse: '「若い者か…まあ期待せんでもないが。」', effect: { conservativeDelta: -2, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 2. リベラル (キラキラ) =====
  {
    id: 'fc_02',
    name: 'アリサ',
    icon: '👩‍🎤',
    gender: 'female',
    ideologyType: 'リベラル',
    opening: 'ねー、最近の政治ってどう思う？もっとみんなが生きやすい社会にしたいよね！',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「ジェンダー平等って、なんでまだ進んでないんだろう。クオータ制の導入とか本気で議論すべきだよね？」',
        choices: [
          { label: '賛成：クオータ制は必要だと思う', charResponse: '「そうだよね！数値目標がないと変わらないんだよね。」', effect: { conservativeDelta: -6, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：能力主義で選ぶべきだ', charResponse: '「んー、でも今の仕組みがすでに不平等だって思わない？」', effect: { conservativeDelta: +6, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：段階的に進めるのが現実的', charResponse: '「そっか、慎重にいくのもわかるけど、焦りもあるんだよね。」', effect: { conservativeDelta: -2, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：もっと広い議論が必要', charResponse: '「そうだね、包括的に考えないとね。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「移民・難民の受け入れをもっと積極的にすべきじゃないかな。人道的な立場から考えたら当然だよ。」',
        choices: [
          { label: '賛成：人道的な支援は必要だ', charResponse: '「ありがとう！そういう考えの人が増えるといいんだけど。」', effect: { conservativeDelta: -6, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：文化的な課題も考慮すべき', charResponse: '「確かに課題はあるけど、それを乗り越える努力も必要じゃないかな。」', effect: { conservativeDelta: +5, consistencyDelta: +3, approvalDelta: 0 } },
          { label: '中立：慎重に進めるべき', charResponse: '「難しいよね…でも前向きに考えてくれると嬉しいな。」', effect: { conservativeDelta: -1, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：まず国内の問題を解決して', charResponse: '「国内と国際、どちらかじゃなくて両方大事だと思うけどな。」', effect: { conservativeDelta: +2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「気候変動対策って今すぐやらなきゃいけないことなのに、なんで後回しにするんだろう。」',
        choices: [
          { label: '賛成：今すぐ行動が必要だ', charResponse: '「そうだよね！若い世代がもっと声を上げていかないと！」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：経済への影響を考えると難しい', charResponse: '「でも経済が止まったら生活できないのも事実だし…複雑だよね。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：バランスを取りながら進める', charResponse: '「そうだね。現実的なアプローチも大切か。」', effect: { conservativeDelta: -1, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：技術革新に期待したい', charResponse: '「技術も大事！でも政策も同時に必要だよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
    ],
  },
  // ===== 3. グローバル推進 (キラキラ) =====
  {
    id: 'fc_03',
    name: 'エリナ',
    icon: '🌍',
    gender: 'female',
    ideologyType: 'グローバル推進',
    opening: '世界はもっとつながるべきだと思う！ボーダーレスな社会が理想！',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「国境なんてもう古いと思わない？グローバルな視点で政策を考えないと遅れるよ。」',
        choices: [
          { label: '賛成：グローバル視点が大切だ', charResponse: '「そうそう！世界基準で考えられる政治家が必要だよ！」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：まず自国の利益を優先すべき', charResponse: '「う〜ん、そういう考えもあるよね…でも閉じてると損すると思うな。」', effect: { conservativeDelta: +6, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：国内外のバランスが重要', charResponse: '「確かに、どちらかだけというのも難しいか。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：地域の文化も大切にしたい', charResponse: '「文化の保存とグローバル化は両立できると思う！」', effect: { conservativeDelta: +2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「英語をもっと公用語に近い形で使えるようにすれば、アルメリアはもっと発展すると思う。」',
        choices: [
          { label: '賛成：国際競争力が上がる', charResponse: '「でしょ！チャンスが広がるよね。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：国語・文化の保護が優先', charResponse: '「それも大事だよね。でも両方できるはずだよ。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：段階的に進めるのが現実的', charResponse: '「うん、無理なく広げていくのが一番かもね。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：教育改革の方が先では', charResponse: '「確かに教育は基盤だね！」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「外国人労働者をもっと受け入れれば、人口減少も乗り越えられるんじゃないかな。」',
        choices: [
          { label: '賛成：多様な人材が経済を活性化する', charResponse: '「そう！多様性がイノベーションを生むんだよ！」', effect: { conservativeDelta: -6, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：文化的摩擦が心配だ', charResponse: '「摩擦は最初だけで、慣れると豊かになるよ。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：条件付きの受け入れが現実的', charResponse: '「現実的に考えるとそうなるよね。」', effect: { conservativeDelta: -1, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：まず少子化対策を', charResponse: '「両方やっていかないと間に合わないよ！」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 4. グローバル抑制 (古風) =====
  {
    id: 'fc_04',
    name: '国岡 誠一郎',
    icon: '🏯',
    gender: 'male',
    ideologyType: 'グローバル抑制',
    opening: 'グローバル化とやらで、この国の良さがどんどん失われておる。嘆かわしい。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「外資に国内産業を買いあさられたら、アルメリアの主権が失われる。経済安全保障が重要じゃ。」',
        choices: [
          { label: '賛成：経済安全保障は重要だ', charResponse: '「そうじゃ！分かる者がいてくれて安心した。」', effect: { conservativeDelta: +7, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '反対：自由貿易が経済を豊かにする', charResponse: '「そう言うが、長期的には依存度が高まりすぎる。」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '中立：一部の産業は守る必要がある', charResponse: '「まあ、そのくらいは正解かもしれん。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：国際競争力を高める方が大事', charResponse: '「競争力は大事だが、それで文化まで売るな。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「グローバル企業に税金を逃げられ続けておる。国内に富を留める仕組みが必要じゃ。」',
        choices: [
          { label: '賛成：タックスヘイブン規制が必要', charResponse: '「そうじゃ！富の還流が国内経済の基盤じゃ。」', effect: { conservativeDelta: +4, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：企業誘致のため税制優遇も必要', charResponse: '「企業誘致も大事だが、際限なくやると空洞化するぞ。」', effect: { conservativeDelta: -2, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：国際協調で対応すべき', charResponse: '「国際協調か…まあ現実的にはそうなるな。」', effect: { conservativeDelta: +1, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：経済成長の方が優先では', charResponse: '「成長と分配は両輪じゃ。片方だけでは崩れる。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「国際機関ばかりに頼らず、アルメリアは独自の外交ルートを持つべきじゃ。」',
        choices: [
          { label: '賛成：自主外交の強化が必要だ', charResponse: '「その通りじゃ！外交力こそ国家の力じゃ。」', effect: { conservativeDelta: +6, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '反対：国際機関との連携が不可欠', charResponse: '「連携も大事だが、依存し過ぎると主体性を失う。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：バランスを取るのが最善', charResponse: '「ふむ、まあそれが現実的かもしれんな。」', effect: { conservativeDelta: +2, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：経済外交が一番効果的では', charResponse: '「経済外交も重要じゃ。分かっとるな。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 5. 積極財政 (普通) =====
  {
    id: 'fc_05',
    name: '中村 健二',
    icon: '💰',
    gender: 'male',
    ideologyType: '積極財政',
    opening: '景気が悪い時こそ、政府がしっかり財政出動するべきだと思うんだよね。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「デフレ脱却のためには財政拡大が必要だよ。緊縮財政でデフレになったという教訓があるじゃないか。」',
        choices: [
          { label: '賛成：積極財政で景気を底上げすべき', charResponse: '「そう！財政出動が経済の血液になるんだよ。」', effect: { conservativeDelta: -3, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：財政規律を守ることが大切', charResponse: '「うーん、借金の膨張は心配じゃないの？」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：状況次第で使い分けるべき', charResponse: '「まあ、臨機応変が大事だね。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：民間投資を促進する方が良い', charResponse: '「民間もだけど、政府の需要創出も重要だよ。」', effect: { conservativeDelta: +2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「インフラ投資を増やせば、雇用が生まれて経済が回る。今こそ大型公共事業の時代だよ。」',
        choices: [
          { label: '賛成：インフラ投資で経済活性化を', charResponse: '「そう！橋や道路の整備は長期的な資産になる。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：効率の悪い公共事業は不要', charResponse: '「確かに無駄なものは要らないね。必要なものを厳選すべき。」', effect: { conservativeDelta: +2, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：費用対効果を検証してから', charResponse: '「それが一番理想的だね。合理的だと思う。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：民間へのインセンティブが効果的', charResponse: '「民間活用も大事だね。組み合わせが一番かな。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「教育や科学研究への投資を増やせば、将来の経済成長につながるはずだよ。」',
        choices: [
          { label: '賛成：人的投資が未来を作る', charResponse: '「そう！知識経済の時代だから、人への投資が一番大事。」', effect: { conservativeDelta: -4, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：財源が足りない以上優先順位が必要', charResponse: '「優先順位はつけないとね。でも削りすぎは危険。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：重点的な分野への集中投資を', charResponse: '「集中戦略は有効だね。選択と集中か。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：民間企業の研究開発に期待したい', charResponse: '「民間も大事だけど、基礎研究は国が担うべきだよ。」', effect: { conservativeDelta: +2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 6. 消極財政 (普通) =====
  {
    id: 'fc_06',
    name: '林 浩一',
    icon: '💹',
    gender: 'male',
    ideologyType: '消極財政',
    opening: '財政再建が先でしょ。将来世代に借金を押しつけるのは無責任だと思う。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「国の借金がGDP比200%超えてるって、もう限界じゃないか。いい加減、歳出削減に本気で取り組まないと。」',
        choices: [
          { label: '賛成：財政再建は今すぐ必要だ', charResponse: '「そう！将来世代のことを真剣に考えないと。」', effect: { conservativeDelta: +4, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '反対：今は景気優先の方が良い', charResponse: '「景気も大事だけど、いつかは向き合わないとね…。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：成長と財政の両立を模索すべき', charResponse: '「理想はそれだよね。具体策が難しいけど。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：税収を増やせば解決では', charResponse: '「増収も大事だが、支出も同時に見直すべきだよ。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「行政の無駄を徹底的に省けば、増税しなくても財政再建できるはずだよ。」',
        choices: [
          { label: '賛成：行政改革で無駄を省くべき', charResponse: '「そう、まず使い方を変えることが先決だよ。」', effect: { conservativeDelta: +3, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：サービス削減では困る人が出る', charResponse: '「セーフティネットは守りながら、他を見直す必要があるね。」', effect: { conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：無駄の定義が難しい', charResponse: '「そうだね、誰にとっての無駄かが問題だよね。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：AI活用で効率化できるのでは', charResponse: '「テクノロジー活用は賛成。でも人も必要だしね。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「社会保障費が膨らみ続けてる。受益と負担のバランスを見直さないといけないよ。」',
        choices: [
          { label: '賛成：受益者負担の見直しが必要', charResponse: '「そうだよ、みんなで支え合う形を再設計する時期だよ。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '反対：社会保障は削れない', charResponse: '「セーフティネットは大切だよね。どこを削るかが問題だ。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '中立：給付の優先順位を整理すべき', charResponse: '「そう、必要な人に必要なものが届く仕組みを作るべき。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：まず経済成長で税収を増やす', charResponse: '「成長も大事だけど、成長だけでは追いつかないよ。」', effect: { conservativeDelta: +2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 7. 大きい政府 (普通) =====
  {
    id: 'fc_07',
    name: '松本 雅人',
    icon: '🏛️',
    gender: 'male',
    ideologyType: '大きい政府',
    opening: '政府がしっかり民間の失敗を補うことが、安定した社会を作ると思ってるんだ。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「教育・医療・保育は全部無償化して、政府が一括管理した方がみんな平等になれると思う。」',
        choices: [
          { label: '賛成：公共サービスの充実が平等を生む', charResponse: '「そうだよね！機会の平等こそが大切だよ。」', effect: { conservativeDelta: -6, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：政府の肥大化はデメリットが多い', charResponse: '「官僚主義の問題はあるけど、市場に任せっぱなしも危険だよ。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：分野によって最適な担い手が違う', charResponse: '「確かに、一律じゃなくて分野ごとに考えるべきだね。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：まず現行制度の改善が先', charResponse: '「まあ改善しながら拡充していくのが現実的かな。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「物価や賃金を政府が管理する一定の仕組みがあれば、格差問題も解決しやすいと思う。」',
        choices: [
          { label: '賛成：格差是正に政府介入は有効だ', charResponse: '「そう！放任主義では格差が広がる一方だよ。」', effect: { conservativeDelta: -5, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：市場メカニズムを尊重すべき', charResponse: '「市場も大切だけど、人間は経済合理性だけじゃ動かないよ。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：最低基準を設けて後は市場に任せる', charResponse: '「それがバランスの取れた方法だね。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：競争の活性化が賃上げにつながる', charResponse: '「競争は大事だけど、セーフティネットも同時に必要だよ。」', effect: { conservativeDelta: +2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「地域格差を解消するには、国がもっと財源を地方に回す仕組みを作らないとダメだよ。」',
        choices: [
          { label: '賛成：地方への財政移転の強化が必要', charResponse: '「そうだよ！東京一極集中を打破しないといけない。」', effect: { conservativeDelta: -2, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：地方の自立を促すべきだ', charResponse: '「自立も大事だけど、スタートラインが違いすぎると自立できないよ。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：条件付きで財政支援を行う', charResponse: '「条件をうまく設定するのが難しいけど、それが理想的かな。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：テレワーク推進で東京分散を', charResponse: '「テレワークは有効だけど、それだけでは解決しないよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 8. 小さい政府 (普通) =====
  {
    id: 'fc_08',
    name: '伊藤 達也',
    icon: '🏪',
    gender: 'male',
    ideologyType: '小さい政府',
    opening: '規制が多すぎると企業が育たないよ。政府は最低限のことだけやっていればいい。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「規制緩和して、もっと民間企業が自由に動けるようにした方が、結果として豊かになると思うんだ。」',
        choices: [
          { label: '賛成：規制緩和で経済活性化を', charResponse: '「そうだよ！官僚が細かく管理するより、市場の方が賢い。」', effect: { conservativeDelta: +5, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '反対：規制なしでは弱者が守られない', charResponse: '「確かに。最低限のセーフティネットは必要だね。」', effect: { conservativeDelta: -5, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '中立：必要な規制と不要な規制を見極める', charResponse: '「それが一番難しくて大事な部分だよね。」', effect: { conservativeDelta: +2, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：業界ごとに判断すべきでは', charResponse: '「そうだね、一律じゃなくて分野別に考えるのが合理的だよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「起業を簡単にして、失敗してもまたやり直せる制度を作れば、経済に活力が生まれるよ。」',
        choices: [
          { label: '賛成：挑戦できる社会が大切だ', charResponse: '「そうだよ！失敗を恐れない文化が革新を生む。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：起業より雇用の安定の方が大事', charResponse: '「雇用の安定と起業支援は両立できるはずだよ。」', effect: { conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：スタートアップ支援と労働保護を両立', charResponse: '「それが現実的なアプローチだね。」', effect: { conservativeDelta: +1, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：教育で起業家精神を育てるべき', charResponse: '「それは本当に大事！基礎から変えていかないと。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「税金を減らして手元にお金を残し、民間が自由に使えるようにする方が経済効果は高いと思う。」',
        choices: [
          { label: '賛成：減税で民間消費を促進すべき', charResponse: '「そう！政府より民間の方が効率的にお金を使える。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '反対：公共投資の方が経済効果が大きい', charResponse: '「財政乗数の議論だね。ケースバイケースだと思う。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：財政と減税のバランスが重要', charResponse: '「それが現実的な答えかな。」', effect: { conservativeDelta: +2, consistencyDelta: +1, approvalDelta: +1 } },
          { label: 'かわす：社会保障があってこその安心感では', charResponse: '「確かにセーフティネットは重要だよね。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 9. 政治に興味がない (古風) - 特殊フロー =====
  {
    id: 'fc_09',
    name: '岡本 幸雄',
    icon: '😐',
    gender: 'male',
    ideologyType: '政治に興味がない',
    opening: '政治？そういうの、あんまり興味ないんだけど…なに話すの？',
    exchanges: [
      {
        type: 'playerAsks',
        isSpecial: true,
        charText: 'どんな話題を振ってみる？',
        choices: [
          { label: '選挙、行ってる？', charResponse: '「んー、行ったり行かなかったり。誰に入れても変わらないし。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1, commDelta: +2 } },
          { label: '景気どう思う？', charResponse: '「なんかじわじわ厳しいよね。でも政治で変わるのかな。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +2, commDelta: +2 } },
          { label: '社会保障について教えてよ', charResponse: '「え、そんな難しいこと聞いても分かんないよ。なんか怖い話だし。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: 0, commDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        isSpecial: true,
        charText: '「ていうか、なんで政治家ってみんな偉そうなの？なんか信用できないんだよね。あなたはどう思う？」',
        choices: [
          { label: '政治家を批判する人が多いよね', charResponse: '「でしょ！やっぱ分かってくれる人がいて良かった。」', effect: { conservativeDelta: 0, consistencyDelta: -3, approvalDelta: -1, commDelta: +1 } },
          { label: 'でも政治家にしかできない仕事もあると思う', charResponse: '「うーん、まあそういう見方もあるか…考えたことなかった。」', effect: { conservativeDelta: 0, consistencyDelta: +3, approvalDelta: +2, commDelta: +3 } },
          { label: 'みんなで政治に関心を持つことが大事では', charResponse: '「そう言われると、そうかもなぁ…でもなぁ…。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2, commDelta: +2 } },
        ],
      },
      {
        type: 'charSpeaks',
        isSpecial: true,
        charText: '「そういえばさ、消費税上がったじゃん。あれって結局、自分には関係ない話じゃないの？」',
        choices: [
          { label: '消費税は全員に関係するよ', charResponse: '「あ、そうか…買い物するたびにか。じゃあ関係あるじゃん。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +3, commDelta: +3 } },
          { label: '確かに実感しにくいよね', charResponse: '「でしょ！なんか遠い話に感じるんだよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: -1, commDelta: +1 } },
          { label: '政治に興味を持つと生活が変わるかも', charResponse: '「…そうなのかな。ちょっと考えてみようかな。」', effect: { conservativeDelta: 0, consistencyDelta: +3, approvalDelta: +3, commDelta: +3 } },
        ],
      },
    ],
  },
  // ===== 10. ナショナリスト (古風) =====
  {
    id: 'fc_10',
    name: '神田 正宏',
    icon: '🎌',
    gender: 'male',
    ideologyType: 'ナショナリスト',
    opening: 'この国の誇りを守るために、もっと毅然とした政策が必要だと思っている。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「アルメリアの文化や伝統をしっかり守るために、外来文化への対策を強化すべきだ。」',
        choices: [
          { label: '賛成：文化の保護は重要だ', charResponse: '「そうだ！アイデンティティがなければ国家はない。」', effect: { conservativeDelta: +8, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '反対：文化の交流が豊かさを生む', charResponse: '「交流は分かる。だが主体性を失っては意味がない。」', effect: { conservativeDelta: -6, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '中立：選択的に文化交流をすべき', charResponse: '「選択的に、ね。それは一つの答えかもしれん。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：経済発展の方が先決では', charResponse: '「経済も大事だが、国魂を失っては何のための経済だ。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「国旗・国歌をもっと敬う文化を育てなければ、国としての結束が保てない。」',
        choices: [
          { label: '賛成：国家への誇りは大切だ', charResponse: '「わかっているな。国家への誇りが国民を一つにする。」', effect: { conservativeDelta: +7, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '反対：強制は逆効果だ', charResponse: '「強制は言い過ぎだが、自然に育む教育は必要だ。」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '中立：多様な表現で愛国心を育む', charResponse: '「多様な表現か。まあ、心からの愛国心が大切だな。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：まず歴史教育の充実が先', charResponse: '「歴史教育は重要だ。自国の歴史を知らずして誇りは持てん。」', effect: { conservativeDelta: +2, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「国内産業を外国から守るために、戦略的な保護主義も選択肢に入れるべきだ。」',
        choices: [
          { label: '賛成：戦略的保護主義は必要だ', charResponse: '「そうだ！重要産業は国が守らねばならん。」', effect: { conservativeDelta: +6, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '反対：自由貿易の方が豊かさをもたらす', charResponse: '「自由貿易で潤う面はある。だが依存リスクを忘れるな。」', effect: { conservativeDelta: -5, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：分野ごとに判断すべき', charResponse: '「分野ごとに戦略を変えるのは賢明だ。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：イノベーションで競争力を上げる', charResponse: '「イノベーションも重要だが、それだけでは外圧に耐えられん。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 11. 環境重視派 (キラキラ) =====
  {
    id: 'fc_11',
    name: 'ユイナ',
    icon: '🌿',
    gender: 'female',
    ideologyType: '環境重視派',
    opening: '地球のことを考えると、もっと本気で環境政策に取り組まないといけないと思う！',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「プラスチック製品の規制をもっと厳しくして、脱プラを国として推進すべきだよ！」',
        choices: [
          { label: '賛成：環境規制の強化が必要だ', charResponse: '「一緒に声を上げていこうよ！地球は一つだから。」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：産業・雇用への影響を考慮すべき', charResponse: '「難しいのはわかるけど、このままじゃ地球が先に終わっちゃう。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：段階的に取り組むのが現実的', charResponse: '「うん、無理なく続けることが大事だよね。」', effect: { conservativeDelta: -1, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：技術革新で代替素材を開発して', charResponse: '「技術は大事！でも規制とセットでないと意味がないよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「再生可能エネルギー100%を目指して、国として大きな投資をすべきだと思うな。」',
        choices: [
          { label: '賛成：再エネ推進は未来への投資だ', charResponse: '「そうだよ！エネルギー自立も達成できるし。」', effect: { conservativeDelta: -5, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '反対：電力の安定供給が前提条件', charResponse: '「安定供給は大切だよ。でも技術は進歩してるから！」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：コストと効果のバランスを検証して', charResponse: '「現実的に見ながら進めるのが大切だよね。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：省エネの推進から始める方が早い', charResponse: '「省エネも大切！でも発電側も変えないとね。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「気候変動対策のために、炭素税を思い切って引き上げた方がいいと思う。」',
        choices: [
          { label: '賛成：炭素税強化が有効な手段だ', charResponse: '「経済的なインセンティブで行動を変えるのが効果的だよね！」', effect: { conservativeDelta: -4, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：家庭・企業の負担が大きすぎる', charResponse: '「負担感はあるよね…でも長期的には得だと思う。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：補助制度と組み合わせて導入を', charResponse: '「補助と組み合わせるのは賢いアプローチだね。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：企業への規制を強化する方が効果的', charResponse: '「企業規制も大事！個人と企業の両面から攻めないと。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
    ],
  },
  // ===== 12. 社会保障重視派 (普通) =====
  {
    id: 'fc_12',
    name: '佐藤 恵子',
    icon: '🏥',
    gender: 'female',
    ideologyType: '社会保障重視派',
    opening: '誰でも安心して老後を迎えられる社会にしないといけないと思ってるの。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「介護の問題がこんなに深刻なのに、なぜ政治家はちゃんと向き合わないんでしょうか。」',
        choices: [
          { label: '賛成：介護政策の充実が急務だ', charResponse: '「ありがとう。現場を知る人が増えることが大切だと思う。」', effect: { conservativeDelta: -4, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：家族が支えるべきという考えもある', charResponse: '「家族の絆は大切だけど、それだけでは限界があるのよ。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：公的支援と家族支援の両立が必要', charResponse: '「そうね、どちらかだけじゃなくて協力が大事。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：移民を受け入れて介護人材を確保', charResponse: '「人材確保は大事。でも環境整備も同時にしないとね。」', effect: { conservativeDelta: -2, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「子育て支援をもっと充実させれば、少子化も少しは改善できると思うんです。」',
        choices: [
          { label: '賛成：子育て支援の拡充が少子化対策の核心', charResponse: '「そうよ！安心して産める環境が一番大切。」', effect: { conservativeDelta: -3, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：少子化は価値観の問題で政策では変わらない', charResponse: '「価値観も大事だけど、環境が変われば選択肢が増えるのよ。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：働き方改革と組み合わせて取り組む', charResponse: '「働き方と子育ての両立環境が整わないとね。その通りだわ。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：教育費の無償化が先では', charResponse: '「教育費も大きな問題ね。包括的に取り組まないと。」', effect: { conservativeDelta: -1, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「障がいがある方も、高齢者も、みんなが地域で暮らせるインクルーシブな社会を作りたいの。」',
        choices: [
          { label: '賛成：インクルーシブ社会の実現が大切', charResponse: '「一緒に声を上げていきましょう。諦めないことが大事よ。」', effect: { conservativeDelta: -5, consistencyDelta: +3, approvalDelta: +3 } },
          { label: '反対：財政的に難しい面もある', charResponse: '「難しいのはわかるけど、コスト以上の価値があると思う。」', effect: { conservativeDelta: +4, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：優先順位をつけながら進める', charResponse: '「現実的に進めることも大切ね。理想を忘れずに。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：NPOや地域コミュニティの役割も大切', charResponse: '「そうね！行政だけでなく地域の力も大切だわ。」', effect: { conservativeDelta: +2, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
    ],
  },
  // ===== 13. 経済成長最優先派 (普通) =====
  {
    id: 'fc_13',
    name: '渡辺 修',
    icon: '📈',
    gender: 'male',
    ideologyType: '経済成長最優先派',
    opening: 'まず経済を成長させることが全てだよ。パイが大きくなれば分配も楽になる。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「成長戦略の核心はイノベーションだよ。規制緩和してスタートアップに投資すれば、雇用も所得も増える。」',
        choices: [
          { label: '賛成：イノベーション推進が経済の鍵', charResponse: '「そう！シリコンバレー的なエコシステムをここにも作りたい。」', effect: { conservativeDelta: +2, consistencyDelta: +3, approvalDelta: +2 } },
          { label: '反対：格差が拡大するリスクがある', charResponse: '「格差は課題だが、成長なければ分配できない。まず成長だ。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：成長と分配の両輪が必要', charResponse: '「理想はそうだよね。難しいけど目指すべき方向だ。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：まず教育への投資が先では', charResponse: '「教育は人的資本投資。成長戦略の重要な柱だよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「法人税を下げてグローバル企業を誘致すれば、税収は結局増えると思うんだよ。」',
        choices: [
          { label: '賛成：企業誘致で経済が活性化する', charResponse: '「そう！長期的な税収増につながる投資だよ。」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '反対：国内企業に不公平になる', charResponse: '「国内企業支援も同時に必要だね。両立できるはずだ。」', effect: { conservativeDelta: -3, consistencyDelta: +2, approvalDelta: +1 } },
          { label: '中立：効果を検証しながら進める', charResponse: '「実証的に考えるのが正しいアプローチだよ。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：富裕層への課税強化の方が公平では', charResponse: '「再分配も大事だが、まず稼ぐ力がないとね。」', effect: { conservativeDelta: -2, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「GDPを成長させれば、環境問題も技術で解決できる。まず豊かになることが先決だ。」',
        choices: [
          { label: '賛成：経済力が技術革新を生む', charResponse: '「そう！豊かさが環境問題解決の余力を作る。」', effect: { conservativeDelta: +3, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '反対：環境破壊は待ってくれない', charResponse: '「タイムラグの問題だね。でも技術進歩も早い。難しいね。」', effect: { conservativeDelta: -4, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '中立：環境投資が新しい成長エンジンになる', charResponse: '「グリーン成長か。面白い考え方だね。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：規制で企業行動を変える方が早い', charResponse: '「規制は大事だが、インセンティブ設計の方が効果的だよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
    ],
  },
  // ===== 14. ポピュリスト (普通) =====
  {
    id: 'fc_14',
    name: '大森 一郎',
    icon: '👊',
    gender: 'male',
    ideologyType: 'ポピュリスト',
    opening: 'エリートばかり優遇して、普通の市民のことは誰も考えてないじゃないか！',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「政治家も官僚もみんなグルになって既得権益を守ってる。もうそういう奴らを全部変えなきゃダメだよ！」',
        choices: [
          { label: '賛成：政治の刷新が必要だ', charResponse: '「そうだよ！新しい血を入れないと何も変わらない！」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: +2 } },
          { label: '反対：経験ある人材も必要では', charResponse: '「経験？今の経験者がダメだから言ってるんだよ！」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：良い人材を選ぶ仕組みが大切', charResponse: '「仕組みか…まあそれが機能してないのが問題なんだけどね。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +1 } },
          { label: 'かわす：市民の政治参加を高めることが大事', charResponse: '「そう！俺たちが声を上げないと変わらないんだよ！」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +2 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「大企業と政治家が癒着してる構造を断ち切らないと、格差は広がるばかりだよ。」',
        choices: [
          { label: '賛成：癒着構造の打破が必要だ', charResponse: '「わかってくれる人がいて良かった！声を上げ続けよう！」', effect: { conservativeDelta: -3, consistencyDelta: -2, approvalDelta: +2 } },
          { label: '反対：企業と政治の連携が経済を動かす', charResponse: '「連携と癒着は違う！透明性がないのが問題なんだよ！」', effect: { conservativeDelta: +5, consistencyDelta: +2, approvalDelta: 0 } },
          { label: '中立：透明性の確保と規制の整備が必要', charResponse: '「まあ、それが現実的な答えかな。でも徹底してほしい。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：メディアの監視機能を強化すべき', charResponse: '「メディアも結局大企業の一部じゃないか！難しいね。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「専門家の意見ばかり聞いて、一般市民の声を聞かない。直接民主主義をもっと取り入れるべきだ！」',
        choices: [
          { label: '賛成：市民の声を直接政策に反映すべき', charResponse: '「そう！国民投票とか、もっと使うべきだよ！」', effect: { conservativeDelta: 0, consistencyDelta: -3, approvalDelta: +2 } },
          { label: '反対：複雑な問題は専門知識が必要', charResponse: '「専門家が間違えることだってあるだろ！市民を信じろ！」', effect: { conservativeDelta: 0, consistencyDelta: +3, approvalDelta: 0 } },
          { label: '中立：専門家と市民の対話を増やすべき', charResponse: '「対話ね…まあそれが一番現実的かな。でも市民の声を軽くするなよ。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：SNSで民意を把握する手法も有効', charResponse: '「SNSか、偏るリスクもあるけど、一つの手段にはなるよな。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: +1 } },
        ],
      },
    ],
  },
  // ===== 15. 陰謀論寄り (古風) =====
  {
    id: 'fc_15',
    name: '荒木 政雄',
    icon: '🕵️',
    gender: 'male',
    ideologyType: '陰謀論寄り',
    opening: '政府の発表をそのまま信じちゃいかんよ。世の中には表に出ない話がたくさんある。',
    exchanges: [
      {
        type: 'charSpeaks',
        charText: '「ワクチンにしろ何にしろ、政府と大企業がグルになって国民を操作してる気がするんだよ。お前はどう思う？」',
        choices: [
          { label: '確かに不透明な点はあると思う', charResponse: '「だろ！批判的に見ることが大事だよ。俺は信じてるぞ。」', effect: { conservativeDelta: 0, consistencyDelta: -3, approvalDelta: -2 } },
          { label: '陰謀論には証拠が必要だ', charResponse: '「証拠？表に出てこないから陰謀なんだよ！」', effect: { conservativeDelta: 0, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '透明性を高める制度の整備が必要', charResponse: '「透明性か…まあそれが理想だが、果たして信用できるかな。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：メディアリテラシーが大切では', charResponse: '「メディアリテラシー？主流メディアこそ信用できんよ。」', effect: { conservativeDelta: 0, consistencyDelta: -1, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「選挙も不正が行われてるんじゃないかと思ってる。電子投票なんて絶対不正されるに決まってる。」',
        choices: [
          { label: '懸念は理解できるが証拠が必要', charResponse: '「まあ、証拠はないけど…怪しいと感じる直感は大事だよ。」', effect: { conservativeDelta: 0, consistencyDelta: +3, approvalDelta: +1 } },
          { label: '現在の制度には監視機能がある', charResponse: '「監視機能も信用できるのか…まあ、そう思いたいよな。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: '透明な監査制度で対応すべき', charResponse: '「監査も形だけじゃ意味ないけどな。まあそれが大事か。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：まず投票率を上げることが大切', charResponse: '「投票率か。そりゃ大事だが、不正があったら無意味じゃないか。」', effect: { conservativeDelta: 0, consistencyDelta: -2, approvalDelta: 0 } },
        ],
      },
      {
        type: 'charSpeaks',
        charText: '「グローバリズムとやらで、実は一部の金持ちが世界を支配しようとしてるんじゃないかと思う。」',
        choices: [
          { label: '格差の拡大への懸念は正しい', charResponse: '「だろ！格差の拡大の裏に何かがある気がする。」', effect: { conservativeDelta: -2, consistencyDelta: -2, approvalDelta: 0 } },
          { label: '陰謀より構造的な問題として捉えるべき', charResponse: '「構造的な問題か。それは認める。見方の問題かもな。」', effect: { conservativeDelta: 0, consistencyDelta: +4, approvalDelta: +3 } },
          { label: '民主的な仕組みで対抗するしかない', charResponse: '「民主主義か…操作されてないと良いんだがな。」', effect: { conservativeDelta: 0, consistencyDelta: +2, approvalDelta: +2 } },
          { label: 'かわす：情報を多角的に確認することが大事', charResponse: '「多角的に…まあそうだな。でも嘘情報を見抜く目も必要だ。」', effect: { conservativeDelta: 0, consistencyDelta: +1, approvalDelta: +1 } },
        ],
      },
    ],
  },
];
