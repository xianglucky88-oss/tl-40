import { DebateFormat } from '@/types';

export interface FlowNode {
  id: string;
  label: string;
  duration?: string;
  side?: 'pro' | 'con' | 'both' | 'judge';
  description?: string;
  nextIds?: string[];
}

export interface ScoringSubItem {
  id: string;
  name: string;
  description: string;
  maxScore: number;
  keyPoints: string[];
}

export interface ScoringSection {
  id: string;
  name: string;
  weight: number;
  maxScore: number;
  description: string;
  subItems: ScoringSubItem[];
}

export interface RuleSection {
  id: string;
  title: string;
  content: string[];
  children?: RuleSection[];
}

export interface RuleHandbookData {
  format: DebateFormat;
  label: string;
  shortName: string;
  icon: string;
  overview: string;
  origins: string;
  treeContent: RuleSection[];
  flowNodes: FlowNode[];
  scoringSections: ScoringSection[];
  tips: string[];
  commonMistakes: string[];
}

const buildTree = (format: DebateFormat): RuleSection[] => {
  const trees: Record<DebateFormat, RuleSection[]> = {
    parliamentary: [
      {
        id: 'p-overview',
        title: '赛制概述',
        content: [
          '议会制辩论（亚太大专辩论赛制）源自英国议会辩论模式，是目前国际上最主流的辩论赛制之一。',
          '每队4名辩手，分别担任首相、副首相、政府党鞭、政府总结（正方）及反对党领袖、反对党副领袖、反对党党鞭、反对党总结（反方）。',
          '比赛共8个环节，总时长约52分钟。',
        ],
      },
      {
        id: 'p-rules',
        title: '核心规则',
        content: [],
        children: [
          {
            id: 'p-rules-speech',
            title: '陈词规则',
            content: [
              '每位辩手有7分钟陈词时间（总结环节为5分钟）。',
              '陈词第一分钟和最后一分钟为保护时间，对方不可提出质询（POI）。',
              '中间5分钟可接受对方的质询，辩手可选择接受或拒绝。',
            ],
          },
          {
            id: 'p-rules-poi',
            title: '质询规则（POI）',
            content: [
              '质询方需站立并说"Point of Information"。',
              '被质询方接受后方可发言，每次质询不超过15秒。',
              '每位辩手至少应接受2次质询。',
            ],
          },
          {
            id: 'p-rules-order',
            title: '发言顺序',
            content: [
              '严格按照首相→反对党领袖→副首相→反对党副领袖→政府党鞭→反对党党鞭→政府总结→反对党总结的顺序。',
              '任何一方不得打乱发言顺序。',
            ],
          },
        ],
      },
      {
        id: 'p-roles',
        title: '辩位职责',
        content: [],
        children: [
          { id: 'p-roles-pm', title: '首相（正方一辩）', content: ['定义辩题关键词', '提出正方核心论点', '构建辩论框架'] },
          { id: 'p-roles-lo', title: '反对党领袖（反方一辩）', content: ['质疑正方定义', '提出反方核心论点', '反驳正方主要论点'] },
          { id: 'p-roles-dpm', title: '副首相（正方二辩）', content: ['回应反方质疑', '补充扩展正方论点', '重建正方框架'] },
          { id: 'p-roles-dlo', title: '反对党副领袖（反方二辩）', content: ['反驳正方重建', '深化反方论点', '提供新论据'] },
          { id: 'p-roles-mg', title: '政府党鞭（正方三辩）', content: ['总结己方论点优势', '指出反方致命漏洞', '不引入全新论点'] },
          { id: 'p-roles-ow', title: '反对党党鞭（反方三辩）', content: ['总结己方论点优势', '指出正方致命漏洞', '不引入全新论点'] },
          { id: 'p-roles-gw', title: '政府总结（正方四辩）', content: ['总结全场辩论', '回应所有核心争议', '不得引入新论点'] },
          { id: 'p-roles-ol', title: '反对党总结（反方四辩）', content: ['总结全场辩论', '回应所有核心争议', '不得引入新论点'] },
        ],
      },
    ],
    mandarin: [
      {
        id: 'm-overview',
        title: '赛制概述',
        content: [
          '华语辩论（新国辩赛制）是华语辩论圈最具影响力的赛制之一，融合了传统华语辩论的精华。',
          '每队4名辩手，比赛分为立论、质询、盘问、自由辩论、结辩五个阶段。',
          '比赛总时长约45分钟。',
        ],
      },
      {
        id: 'm-rules',
        title: '核心规则',
        content: [],
        children: [
          {
            id: 'm-rules-opening',
            title: '立论阶段',
            content: ['正反方一辩各3分钟陈词', '需完整阐述本方立场、论点、论据', '立论是整场辩论的基础框架'],
          },
          {
            id: 'm-rules-cross',
            title: '质询阶段',
            content: [
              '质询方只能提问，被质询方只能回答',
              '质询方可以打断被质询方的回答',
              '被质询方不得反问',
              '每次质询2分钟',
            ],
          },
          {
            id: 'm-rules-interrogation',
            title: '盘问阶段',
            content: ['正反方三辩对对方一、二、四辩进行盘问', '被盘问者只能回答不能反问', '盘问后由盘问方做2分钟小结'],
          },
          {
            id: 'm-rules-free',
            title: '自由辩论',
            content: [
              '双方各4分钟，交替发言',
              '一方发言结束后另一方才能开始',
              '每位辩手的发言次数和顺序不受限制',
              '一方时间用尽后另一方可继续发言',
            ],
          },
          {
            id: 'm-rules-closing',
            title: '结辩阶段',
            content: ['先反方四辩后正方四辩，各3分钟', '总结全场辩论交锋', '不得引入全新论点'],
          },
        ],
      },
      {
        id: 'm-tips',
        title: '辩论技巧',
        content: [],
        children: [
          { id: 'm-tips-frame', title: '立论框架', content: ['定义清晰', '论点分层', '论据充实'] },
          { id: 'm-tips-cross', title: '质询技巧', content: ['封闭性提问', '设置逻辑陷阱', '控制回答方向'] },
          { id: 'm-tips-free', title: '自由辩论', content: ['团队配合', '把握节奏', '聚焦核心'] },
        ],
      },
    ],
    moot_court: [
      {
        id: 'mc-overview',
        title: '赛制概述',
        content: [
          '模拟法庭赛制是法学专业学生的经典竞赛形式，模拟真实法庭审判过程。',
          '分为原告方（控方）和被告方（辩方），各自进行开场陈述、法庭盘问、反驳陈述。',
          '法官团全程参与，可随时发问。',
          '比赛总时长约70分钟。',
        ],
      },
      {
        id: 'mc-rules',
        title: '法庭程序',
        content: [],
        children: [
          {
            id: 'mc-rules-opening',
            title: '开场陈述',
            content: [
              '原告方先作10分钟开场陈述',
              '被告方后作10分钟开场陈述',
              '需说明案件事实、法律依据、诉讼请求（或辩护要点）',
            ],
          },
          {
            id: 'mc-rules-exam',
            title: '法庭盘问',
            content: [
              '原告方盘问本方证人（直接询问）15分钟',
              '被告方盘问本方证人（直接询问）15分钟',
              '盘问需遵守证据规则',
              '禁止诱导性提问（直接询问时）',
            ],
          },
          {
            id: 'mc-rules-rebuttal',
            title: '反驳陈述',
            content: [
              '原告方先作5分钟反驳',
              '被告方后作5分钟反驳',
              '针对对方陈述和证据中的漏洞进行反驳',
            ],
          },
          {
            id: 'mc-rules-judge',
            title: '法官评议',
            content: ['法官团退庭评议10分钟', '就法律适用和事实认定进行讨论', '形成判决意见'],
          },
          {
            id: 'mc-rules-verdict',
            title: '宣判阶段',
            content: ['主审法官宣读判决5分钟', '说明判决理由和法律依据', '宣布胜负结果'],
          },
        ],
      },
      {
        id: 'mc-etiquette',
        title: '法庭礼仪',
        content: [],
        children: [
          { id: 'mc-etiquette-dress', title: '着装要求', content: ['穿着正装或律师袍', '仪容整洁', '佩戴领带/丝巾'] },
          { id: 'mc-etiquette-speech', title: '言行规范', content: ['面向法官发言', '使用"审判长""法官阁下"等尊称', '发言前举手示意'] },
          { id: 'mc-etiquette-conduct', title: '行为准则', content: ['不得打断法官或对方发言', '尊重法庭裁决', '保持肃静'] },
        ],
      },
    ],
    british_parliamentary: [
      {
        id: 'bp-overview',
        title: '赛制概述',
        content: [
          '英国议会制（BP赛制）是世界大学生辩论赛（WUDC）采用的标准赛制。',
          '四支队伍同时参赛：正方上院（OG）、反方上院（OO）、正方下院（CG）、反方下院（CO），每队2人。',
          '每队排名1-4名，第一名得3分，第二名得2分，第三名得1分，第四名得0分。',
          '比赛共8个发言，每人7分钟，总时长约56分钟。',
        ],
      },
      {
        id: 'bp-rules',
        title: '核心规则',
        content: [],
        children: [
          {
            id: 'bp-rules-speech',
            title: '发言规则',
            content: [
              '每人7分钟发言时间',
              '第一分钟和最后一分钟为保护时间',
              '中间5分钟可接受POI（质询）',
            ],
          },
          {
            id: 'bp-rules-extension',
            title: '延伸规则',
            content: [
              '下院必须提出不同于上院的新论点或新视角（Extension）',
              '仅重复上院论点的队伍排名会靠后',
              '下院可以支持但必须超越上院的论述',
            ],
          },
          {
            id: 'bp-rules-poi',
            title: '质询规则（POI）',
            content: [
              '任何队伍都可以向发言者提出POI',
              '建议每位辩手至少接受2次POI',
              'POI应简洁有力，不超过15秒',
            ],
          },
        ],
      },
      {
        id: 'bp-roles',
        title: '各队职责',
        content: [],
        children: [
          { id: 'bp-roles-og', title: '正方上院（OG）', content: ['定义辩题', '构建正方核心论点', '设定辩论框架'] },
          { id: 'bp-roles-oo', title: '反方上院（OO）', content: ['质疑或接受OG的定义', '构建反方核心论点', '反驳OG的主要论点'] },
          { id: 'bp-roles-cg', title: '正方下院（CG）', content: ['提出不同于OG的延伸论点', '补充和深化正方立场', '展示独特的分析视角'] },
          { id: 'bp-roles-co', title: '反方下院（CO）', content: ['提出不同于OO的延伸论点', '补充和深化反方立场', '反驳正方所有论点'] },
        ],
      },
      {
        id: 'bp-judging',
        title: '评判标准',
        content: [],
        children: [
          { id: 'bp-judging-rank', title: '排名原则', content: ['根据整体贡献度排名', '论点质量和创新性是关键', '延伸（Extension）的质量极为重要'] },
          { id: 'bp-judging-mark', title: '打分说明', content: ['每队独立评分', '第一名3分，第二名2分，第三名1分，第四名0分', '不允许并列排名'] },
        ],
      },
    ],
  };
  return trees[format];
};

const buildFlow = (format: DebateFormat): FlowNode[] => {
  const flows: Record<DebateFormat, FlowNode[]> = {
    parliamentary: [
      { id: 'p-start', label: '比赛开始', side: 'both', nextIds: ['p-pm'] },
      { id: 'p-pm', label: '首相陈词', duration: '7分钟', side: 'pro', description: '定义辩题，构建正方框架', nextIds: ['p-lo'] },
      { id: 'p-lo', label: '反对党领袖陈词', duration: '7分钟', side: 'con', description: '质疑定义，提出反方论点', nextIds: ['p-dpm'] },
      { id: 'p-dpm', label: '副首相陈词', duration: '7分钟', side: 'pro', description: '回应质疑，补充扩展论点', nextIds: ['p-dlo'] },
      { id: 'p-dlo', label: '反对党副领袖陈词', duration: '7分钟', side: 'con', description: '反驳正方，深化反方论点', nextIds: ['p-mg'] },
      { id: 'p-mg', label: '政府党鞭陈词', duration: '7分钟', side: 'pro', description: '总结优势，指出对方漏洞', nextIds: ['p-ow'] },
      { id: 'p-ow', label: '反对党党鞭陈词', duration: '7分钟', side: 'con', description: '总结优势，指出对方漏洞', nextIds: ['p-gw'] },
      { id: 'p-gw', label: '政府总结', duration: '5分钟', side: 'pro', description: '总结全场，回应争议', nextIds: ['p-ol'] },
      { id: 'p-ol', label: '反对党总结', duration: '5分钟', side: 'con', description: '总结全场，回应争议', nextIds: ['p-end'] },
      { id: 'p-end', label: '比赛结束', side: 'both' },
    ],
    mandarin: [
      { id: 'm-start', label: '比赛开始', side: 'both', nextIds: ['m-pro1'] },
      { id: 'm-pro1', label: '正方一辩立论', duration: '3分钟', side: 'pro', description: '阐述正方立场、论点、论据', nextIds: ['m-cross1'] },
      { id: 'm-cross1', label: '反方四辩质询正方一辩', duration: '2分钟', side: 'con', description: '针对立论进行攻击', nextIds: ['m-con1'] },
      { id: 'm-con1', label: '反方一辩立论', duration: '3分钟', side: 'con', description: '阐述反方立场、论点、论据', nextIds: ['m-cross2'] },
      { id: 'm-cross2', label: '正方四辩质询反方一辩', duration: '2分钟', side: 'pro', description: '针对立论进行攻击', nextIds: ['m-pro2'] },
      { id: 'm-pro2', label: '正方二辩陈词', duration: '3分钟', side: 'pro', description: '补充论点，回应质询', nextIds: ['m-cross3'] },
      { id: 'm-cross3', label: '反方三辩质询正方二辩', duration: '2分钟', side: 'con', description: '针对二辩进行攻击', nextIds: ['m-con2'] },
      { id: 'm-con2', label: '反方二辩陈词', duration: '3分钟', side: 'con', description: '补充论点，回应质询', nextIds: ['m-cross4'] },
      { id: 'm-cross4', label: '正方三辩质询反方二辩', duration: '2分钟', side: 'pro', description: '针对二辩进行攻击', nextIds: ['m-pro3'] },
      { id: 'm-pro3', label: '正方三辩盘问小结', duration: '2分钟', side: 'pro', description: '总结盘问成果', nextIds: ['m-con3'] },
      { id: 'm-con3', label: '反方三辩盘问小结', duration: '2分钟', side: 'con', description: '总结盘问成果', nextIds: ['m-free'] },
      { id: 'm-free', label: '自由辩论', duration: '各4分钟', side: 'both', description: '双方交替发言，灵活交锋', nextIds: ['m-con4'] },
      { id: 'm-con4', label: '反方四辩结辩', duration: '3分钟', side: 'con', description: '总结全场辩论', nextIds: ['m-pro4'] },
      { id: 'm-pro4', label: '正方四辩结辩', duration: '3分钟', side: 'pro', description: '总结全场辩论', nextIds: ['m-end'] },
      { id: 'm-end', label: '比赛结束', side: 'both' },
    ],
    moot_court: [
      { id: 'mc-start', label: '开庭', side: 'judge', nextIds: ['mc-opening-pro'] },
      { id: 'mc-opening-pro', label: '原告方开场陈述', duration: '10分钟', side: 'pro', description: '陈述事实、法律依据、诉讼请求', nextIds: ['mc-opening-con'] },
      { id: 'mc-opening-con', label: '被告方开场陈述', duration: '10分钟', side: 'con', description: '陈述辩护要点、否认指控', nextIds: ['mc-exam-pro'] },
      { id: 'mc-exam-pro', label: '原告方法庭盘问', duration: '15分钟', side: 'pro', description: '直接询问本方证人', nextIds: ['mc-exam-con'] },
      { id: 'mc-exam-con', label: '被告方法庭盘问', duration: '15分钟', side: 'con', description: '直接询问本方证人', nextIds: ['mc-rebuttal-pro'] },
      { id: 'mc-rebuttal-pro', label: '原告方反驳陈述', duration: '5分钟', side: 'pro', description: '反驳对方证据和论述', nextIds: ['mc-rebuttal-con'] },
      { id: 'mc-rebuttal-con', label: '被告方反驳陈述', duration: '5分钟', side: 'con', description: '反驳对方证据和论述', nextIds: ['mc-bench'] },
      { id: 'mc-bench', label: '法官团评议', duration: '10分钟', side: 'judge', description: '退庭评议，形成判决', nextIds: ['mc-verdict'] },
      { id: 'mc-verdict', label: '宣判', duration: '5分钟', side: 'judge', description: '宣读判决及理由', nextIds: ['mc-end'] },
      { id: 'mc-end', label: '闭庭', side: 'judge' },
    ],
    british_parliamentary: [
      { id: 'bp-start', label: '比赛开始', side: 'both', nextIds: ['bp-pm'] },
      { id: 'bp-pm', label: '首相 · 正方上院1', duration: '7分钟', side: 'pro', description: '定义辩题，构建正方框架', nextIds: ['bp-lo'] },
      { id: 'bp-lo', label: '反对党领袖 · 反方上院1', duration: '7分钟', side: 'con', description: '质疑定义，提出反方论点', nextIds: ['bp-dpm'] },
      { id: 'bp-dpm', label: '副首相 · 正方上院2', duration: '7分钟', side: 'pro', description: '回应质疑，扩展OG论点', nextIds: ['bp-dlo'] },
      { id: 'bp-dlo', label: '反对党副领袖 · 反方上院2', duration: '7分钟', side: 'con', description: '反驳正方，扩展OO论点', nextIds: ['bp-mg'] },
      { id: 'bp-mg', label: '政府成员 · 正方下院1', duration: '7分钟', side: 'pro', description: '提出CG延伸论点', nextIds: ['bp-ow'] },
      { id: 'bp-ow', label: '反对党成员 · 反方下院1', duration: '7分钟', side: 'con', description: '提出CO延伸论点', nextIds: ['bp-gw'] },
      { id: 'bp-gw', label: '政府党鞭 · 正方下院2', duration: '7分钟', side: 'pro', description: '总结CG延伸，回应全场', nextIds: ['bp-ol'] },
      { id: 'bp-ol', label: '反对党党鞭 · 反方下院2', duration: '7分钟', side: 'con', description: '总结CO延伸，回应全场', nextIds: ['bp-end'] },
      { id: 'bp-end', label: '比赛结束', side: 'both' },
    ],
  };
  return flows[format];
};

const buildScoring = (format: DebateFormat): ScoringSection[] => {
  const scorings: Record<DebateFormat, ScoringSection[]> = {
    parliamentary: [
      {
        id: 'p-content',
        name: '立论内容',
        weight: 0.3,
        maxScore: 30,
        description: '评估论点的深度、广度与逻辑性',
        subItems: [
          { id: 'p-content-1', name: '定义清晰度', description: '对辩题关键词的定义是否准确、合理', maxScore: 10, keyPoints: ['定义是否符合常识', '是否有利于本方论述', '是否被对方成功攻击'] },
          { id: 'p-content-2', name: '论点深度', description: '论点分析的深入程度', maxScore: 10, keyPoints: ['是否触及问题本质', '论证层次是否丰富', '逻辑链条是否完整'] },
          { id: 'p-content-3', name: '论点广度', description: '论点覆盖的维度', maxScore: 10, keyPoints: ['是否多角度论证', '是否考虑不同利益相关方', '论据是否多样'] },
        ],
      },
      {
        id: 'p-evidence',
        name: '论据与论证',
        weight: 0.25,
        maxScore: 25,
        description: '论据的质量、相关性与论证严密性',
        subItems: [
          { id: 'p-evidence-1', name: '论据质量', description: '论据的可信度和权威性', maxScore: 10, keyPoints: ['数据来源是否可靠', '案例是否典型', '专家意见是否权威'] },
          { id: 'p-evidence-2', name: '论证逻辑', description: '推理过程的严密性', maxScore: 8, keyPoints: ['是否存在逻辑谬误', '因果关系是否成立', '类比是否恰当'] },
          { id: 'p-evidence-3', name: '论据相关性', description: '论据与论点的关联度', maxScore: 7, keyPoints: ['论据是否直接支持论点', '是否有断章取义', '是否有偷换概念'] },
        ],
      },
      {
        id: 'p-delivery',
        name: '表达与风采',
        weight: 0.2,
        maxScore: 20,
        description: '语言流畅度、感染力与台风',
        subItems: [
          { id: 'p-delivery-1', name: '语言表达', description: '语言的流畅性和准确性', maxScore: 8, keyPoints: ['口齿是否清晰', '用词是否精准', '语速是否适中'] },
          { id: 'p-delivery-2', name: '感染力', description: '演讲的感染力和说服力', maxScore: 6, keyPoints: ['语气语调是否有变化', '是否有情感共鸣', '肢体语言是否恰当'] },
          { id: 'p-delivery-3', name: '台风仪态', description: '辩手的整体风度', maxScore: 6, keyPoints: ['是否自信从容', '是否尊重对方', '是否遵守规则'] },
        ],
      },
      {
        id: 'p-rebuttal',
        name: '反驳与应变',
        weight: 0.25,
        maxScore: 25,
        description: '对对方论点的有效回应与临场应变',
        subItems: [
          { id: 'p-rebuttal-1', name: '反驳精准度', description: '是否直击对方要害', maxScore: 10, keyPoints: ['是否抓住核心论点', '是否避免稻草人谬误', '反驳是否到位'] },
          { id: 'p-rebuttal-2', name: '应变能力', description: '应对突发情况的能力', maxScore: 8, keyPoints: ['是否有效回应POI', '是否灵活调整策略', '是否处理对方突袭'] },
          { id: 'p-rebuttal-3', name: '重建能力', description: '被攻击后重建己方论点的能力', maxScore: 7, keyPoints: ['是否回应所有攻击', '修复是否有效', '是否加强原论点'] },
        ],
      },
    ],
    mandarin: [
      {
        id: 'm-content',
        name: '立论内容',
        weight: 0.3,
        maxScore: 30,
        description: '论点的深度、广度与逻辑性',
        subItems: [
          { id: 'm-content-1', name: '立论框架', description: '整体立论的架构设计', maxScore: 12, keyPoints: ['定义是否清晰', '标准是否合理', '论点是否层次分明'] },
          { id: 'm-content-2', name: '论点质量', description: '单个论点的说服力', maxScore: 10, keyPoints: ['逻辑是否严密', '论据是否充分', '价值是否可取'] },
          { id: 'm-content-3', name: '论据支撑', description: '论据的质量和运用', maxScore: 8, keyPoints: ['数据是否权威', '案例是否贴切', '是否灵活运用'] },
        ],
      },
      {
        id: 'm-evidence',
        name: '质询与盘问',
        weight: 0.25,
        maxScore: 25,
        description: '质询盘问的技巧和效果',
        subItems: [
          { id: 'm-evidence-1', name: '提问技巧', description: '质询问题的设计和执行', maxScore: 10, keyPoints: ['问题是否有攻击性', '是否设置逻辑陷阱', '是否控制回答方向'] },
          { id: 'm-evidence-2', name: '回答质量', description: '应对质询的表现', maxScore: 8, keyPoints: ['是否正面回应', '是否化解攻击', '是否反守为攻'] },
          { id: 'm-evidence-3', name: '盘问总结', description: '盘问小结的质量', maxScore: 7, keyPoints: ['是否总结盘问成果', '是否转化为己方优势', '是否清晰有力'] },
        ],
      },
      {
        id: 'm-delivery',
        name: '自由辩论',
        weight: 0.2,
        maxScore: 20,
        description: '自由辩论的表现',
        subItems: [
          { id: 'm-delivery-1', name: '团队配合', description: '队友之间的协作', maxScore: 8, keyPoints: ['是否有序交替', '是否互相补位', '是否聚焦同一战线'] },
          { id: 'm-delivery-2', name: '交锋质量', description: '辩论交锋的深度', maxScore: 7, keyPoints: ['是否回避问题', '是否有实质交锋', '是否推进辩论'] },
          { id: 'm-delivery-3', name: '节奏把握', description: '对辩论节奏的控制', maxScore: 5, keyPoints: ['时间分配是否合理', '是否掌握主动权', '是否抓住战机'] },
        ],
      },
      {
        id: 'm-rebuttal',
        name: '结辩与总结',
        weight: 0.25,
        maxScore: 25,
        description: '结辩的质量和效果',
        subItems: [
          { id: 'm-rebuttal-1', name: '全场梳理', description: '对整场辩论的梳理能力', maxScore: 10, keyPoints: ['是否抓住核心争议', '是否完整回顾交锋', '是否清晰对比双方'] },
          { id: 'm-rebuttal-2', name: '价值升华', description: '结辩的价值高度', maxScore: 9, keyPoints: ['是否有价值输出', '是否引发思考', '是否有感染力'] },
          { id: 'm-rebuttal-3', name: '逻辑闭环', description: '形成完整的论证闭环', maxScore: 6, keyPoints: ['是否回应所有关键问题', '是否强化己方立场', '是否有说服力'] },
        ],
      },
    ],
    moot_court: [
      {
        id: 'mc-reasoning',
        name: '法律论证',
        weight: 0.35,
        maxScore: 35,
        description: '法律适用的准确性与论证逻辑',
        subItems: [
          { id: 'mc-reasoning-1', name: '法律适用', description: '对法律法规的理解和运用', maxScore: 15, keyPoints: ['法条引用是否准确', '法律解释是否合理', '适用是否恰当'] },
          { id: 'mc-reasoning-2', name: '案例运用', description: '对判例的援引和分析', maxScore: 10, keyPoints: ['判例是否相关', '类比是否恰当', '区分是否有力'] },
          { id: 'mc-reasoning-3', name: '逻辑推理', description: '法律推理的严密性', maxScore: 10, keyPoints: ['三段论是否完整', '推理是否有漏洞', '结论是否必然'] },
        ],
      },
      {
        id: 'mc-fact',
        name: '事实分析',
        weight: 0.25,
        maxScore: 25,
        description: '对案件事实的梳理与运用',
        subItems: [
          { id: 'mc-fact-1', name: '事实梳理', description: '对案件事实的整理和呈现', maxScore: 10, keyPoints: ['是否完整准确', '是否突出有利事实', '是否弱化不利事实'] },
          { id: 'mc-fact-2', name: '证据运用', description: '对证据的运用', maxScore: 10, keyPoints: ['证据是否充分', '举证是否合规', '质证是否有力'] },
          { id: 'mc-fact-3', name: '事实认定', description: '对争议事实的论证', maxScore: 5, keyPoints: ['论证是否有说服力', '是否合理推断', '是否符合证据规则'] },
        ],
      },
      {
        id: 'mc-advocacy',
        name: '辩护技巧',
        weight: 0.25,
        maxScore: 25,
        description: '陈述感染力、问答策略',
        subItems: [
          { id: 'mc-advocacy-1', name: '陈述技巧', description: '开场和反驳陈述的质量', maxScore: 10, keyPoints: ['叙事是否引人入胜', '重点是否突出', '逻辑是否清晰'] },
          { id: 'mc-advocacy-2', name: '询问技巧', description: '直接询问和交叉询问', maxScore: 10, keyPoints: ['问题设计是否巧妙', '是否引导出有利证言', '是否遵守询问规则'] },
          { id: 'mc-advocacy-3', name: '临场应变', description: '应对法官和对方的突发情况', maxScore: 5, keyPoints: ['是否回应法官提问', '是否灵活调整策略', '是否化解危机'] },
        ],
      },
      {
        id: 'mc-manner',
        name: '法庭礼仪',
        weight: 0.15,
        maxScore: 15,
        description: '着装、言行、程序规范',
        subItems: [
          { id: 'mc-manner-1', name: '着装仪态', description: '着装和仪表是否得体', maxScore: 5, keyPoints: ['是否着正装', '仪容是否整洁', '姿态是否端正'] },
          { id: 'mc-manner-2', name: '言行规范', description: '法庭上的言行举止', maxScore: 5, keyPoints: ['是否使用尊称', '是否面向法官发言', '是否打断他人'] },
          { id: 'mc-manner-3', name: '程序遵守', description: '对法庭程序的遵守', maxScore: 5, keyPoints: ['是否遵守发言顺序', '是否尊重法官裁决', '是否遵守程序规则'] },
        ],
      },
    ],
    british_parliamentary: [
      {
        id: 'bp-argument',
        name: '论点质量',
        weight: 0.3,
        maxScore: 30,
        description: '论点的创新性与价值',
        subItems: [
          { id: 'bp-argument-1', name: '创新性', description: '论点是否有新意', maxScore: 12, keyPoints: ['是否提供新视角', '是否有独特分析', '是否超越常识'] },
          { id: 'bp-argument-2', name: '论证力度', description: '论点的说服力', maxScore: 10, keyPoints: ['逻辑是否严密', '论据是否充分', '推理是否合理'] },
          { id: 'bp-argument-3', name: '价值意义', description: '论点的现实意义和价值', maxScore: 8, keyPoints: ['是否有现实关怀', '是否触及深层问题', '是否有启发性'] },
        ],
      },
      {
        id: 'bp-extension',
        name: '延伸扩展',
        weight: 0.3,
        maxScore: 30,
        description: '下院对上院论点的有效延伸',
        subItems: [
          { id: 'bp-extension-1', name: '区分度', description: '与上院论点的区别', maxScore: 12, keyPoints: ['是否明显不同于上院', '是否有独立分析', '是否有新的维度'] },
          { id: 'bp-extension-2', name: '贡献度', description: '延伸对辩论的贡献', maxScore: 10, keyPoints: ['是否推进辩论深度', '是否提供关键论据', '是否改变辩论走向'] },
          { id: 'bp-extension-3', name: '整合能力', description: '与上院论点的整合', maxScore: 8, keyPoints: ['是否支持本方上院', '是否形成合力', '是否有效回应对方'] },
        ],
      },
      {
        id: 'bp-strategy',
        name: '辩论策略',
        weight: 0.2,
        maxScore: 20,
        description: '团队配合与立场把握',
        subItems: [
          { id: 'bp-strategy-1', name: '团队配合', description: '同队两位辩手的配合', maxScore: 8, keyPoints: ['是否互相呼应', '是否分工明确', '是否形成合力'] },
          { id: 'bp-strategy-2', name: 'POI运用', description: '质询和回应质询', maxScore: 6, keyPoints: ['是否主动提出POI', 'POI是否有质量', '是否有效回应POI'] },
          { id: 'bp-strategy-3', name: '立场把握', description: '对本方立场的坚守', maxScore: 6, keyPoints: ['是否偏离立场', '是否前后一致', '是否有效防守'] },
        ],
      },
      {
        id: 'bp-speech',
        name: '演讲水平',
        weight: 0.2,
        maxScore: 20,
        description: '表达与感染力',
        subItems: [
          { id: 'bp-speech-1', name: '语言表达', description: '语言的流畅和精准', maxScore: 8, keyPoints: ['用词是否精准', '表达是否流畅', '语速是否适中'] },
          { id: 'bp-speech-2', name: '结构安排', description: '演讲的结构设计', maxScore: 6, keyPoints: ['是否有条理', '重点是否突出', '时间分配是否合理'] },
          { id: 'bp-speech-3', name: '感染力', description: '演讲的感染力和风度', maxScore: 6, keyPoints: ['是否有说服力', '是否自信从容', '是否有个人风格'] },
        ],
      },
    ],
  };
  return scorings[format];
};

const buildTips = (format: DebateFormat): string[] => {
  const tipsMap: Record<DebateFormat, string[]> = {
    parliamentary: [
      '首相的定义至关重要，好的定义能主导整场辩论的走向',
      'POI（质询）是议会制的核心特色，要善于利用也善于接受',
      '党鞭环节不要引入新论点，重点在于总结和打击对方漏洞',
      '保护时间要充分利用，想好开场和结尾的金句',
      '接受POI时不要慌张，先听完问题再从容作答',
    ],
    mandarin: [
      '立论要留有余地，不要把话说太满，给后续辩手留发挥空间',
      '质询多用封闭性问题，让对方只能答"是"或"不是"',
      '自由辩论最忌讳单兵作战，一定要有团队配合意识',
      '结辩不要照稿念，要真正回应场上的交锋点',
      '质询时不要和对方纠缠细节，要奔着对方的核心逻辑去',
    ],
    moot_court: [
      '法律条文引用要准确，记错法条是致命错误',
      '法庭盘问要设计好问题链条，一步一步引导证人说出你想要的答案',
      '法官提问时要立刻停下，认真听完再作答',
      '开场陈述要像讲故事一样引人入胜，而不是念法条',
      '法庭礼仪不可忽视，第一印象很重要',
    ],
    british_parliamentary: [
      '下院最重要的是Extension（延伸），单纯重复上院论点一定得低分',
      '四队制不是二对二，你和同方上院也是竞争关系',
      '好的Extension往往是从新的利益相关方、新的分析角度切入',
      '党鞭的总结要告诉评委：为什么我方队伍应该是第一名',
      'BP赛制中POI非常重要，不主动提POI会被认为没有参与感',
    ],
  };
  return tipsMap[format];
};

const buildMistakes = (format: DebateFormat): string[] => {
  const mistakesMap: Record<DebateFormat, string[]> = {
    parliamentary: [
      '在保护时间内提出POI，这是违反规则的',
      '党鞭环节引入全新论点，会被评委扣分',
      '完全拒绝接受任何POI，显得缺乏自信',
      '首相没有给出清晰的定义，导致辩题模糊',
      '总结环节仍然在读准备好的稿子，不回应场上交锋',
    ],
    mandarin: [
      '质询时被对方带偏，忘记自己的原始问题',
      '自由辩论一人抢着说，队友完全插不上话',
      '结辩时引入了前面完全没提过的新论点',
      '回答质询时反问对方，违反质询规则',
      '立论只做了论点堆砌，没有形成完整的逻辑链',
    ],
    moot_court: [
      '直接询问时使用诱导性提问，被法官制止',
      '没有证据就主张某一事实',
      '打断法官或对方律师发言，这是严重的失礼',
      '引用不存在的法条或判例',
      '开场陈述时间到了还在强行说完',
    ],
    british_parliamentary: [
      '下院完全重复上院的论点，没有任何延伸',
      '只顾反驳对方，忘记推进己方的延伸论点',
      '定义过于刁钻，导致辩题失去讨论意义',
      '党鞭在总结时遗漏了己方最重要的延伸',
      '在保护时间内打断对方发言',
    ],
  };
  return mistakesMap[format];
};

const OVERVIEW_MAP: Record<DebateFormat, { label: string; shortName: string; icon: string; overview: string; origins: string }> = {
  parliamentary: {
    label: '议会制辩论（亚太大专）',
    shortName: '议会制',
    icon: 'landmark',
    overview: '源自英国议会的经典辩论模式，每队4人，8个发言环节，允许中间5分钟接受对方质询（POI）。强调辩论框架构建和临场应变。',
    origins: '议会制辩论源于19世纪初英国议会的议事传统，后经过亚太大专辩论赛（Australs）等国际赛事发展完善，成为全球最流行的辩论赛制之一。',
  },
  mandarin: {
    label: '华语辩论（新国辩赛制）',
    shortName: '华语赛',
    icon: 'message-circle',
    overview: '华语辩论圈主流赛制，融合立论、质询、盘问、自由辩论、结辩五个阶段，注重逻辑交锋和团队配合。',
    origins: '华语辩论起源于1986年新加坡广播局首创的亚洲大专辩论会，历经国际大专辩论赛、世界华语辩论锦标赛等赛事发展，形成了以新国辩为代表的现代华语赛制。',
  },
  moot_court: {
    label: '模拟法庭赛制',
    shortName: '模拟法庭',
    icon: 'scale',
    overview: '模拟真实法庭审判过程，原告被告双方各10分钟开场、15分钟盘问、5分钟反驳，法官全程参与并最终宣判。',
    origins: '模拟法庭（Moot Court）起源于美国法学院的教学实践，最早可追溯至19世纪的哈佛法学院，现已成为全球法学教育和竞赛的重要形式。',
  },
  british_parliamentary: {
    label: '英国议会制（BP赛制）',
    shortName: 'BP赛制',
    icon: 'crown',
    overview: '世界大学生辩论赛标准赛制，四队同时参赛（正方上下院+反方上下院），每队2人，重点考察下院对上院的延伸扩展能力。',
    origins: 'BP赛制是世界大学生辩论赛（World Universities Debating Championship, WUDC）的官方赛制，自1981年创办以来，已成为全球规模最大、影响力最广的大学生辩论赛事。',
  },
};

export const RULES_HANDBOOK: Record<DebateFormat, RuleHandbookData> = (['parliamentary', 'mandarin', 'moot_court', 'british_parliamentary'] as DebateFormat[]).reduce(
  (acc, format) => {
    const meta = OVERVIEW_MAP[format];
    acc[format] = {
      format,
      label: meta.label,
      shortName: meta.shortName,
      icon: meta.icon,
      overview: meta.overview,
      origins: meta.origins,
      treeContent: buildTree(format),
      flowNodes: buildFlow(format),
      scoringSections: buildScoring(format),
      tips: buildTips(format),
      commonMistakes: buildMistakes(format),
    };
    return acc;
  },
  {} as Record<DebateFormat, RuleHandbookData>,
);

export const getRuleHandbook = (format: DebateFormat): RuleHandbookData => RULES_HANDBOOK[format];

export const searchHandbook = (keyword: string): { format: DebateFormat; sectionId: string; sectionTitle: string; matchText: string }[] => {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return [];
  const results: { format: DebateFormat; sectionId: string; sectionTitle: string; matchText: string }[] = [];
  (['parliamentary', 'mandarin', 'moot_court', 'british_parliamentary'] as DebateFormat[]).forEach((format) => {
    const data = RULES_HANDBOOK[format];
    const searchInSections = (sections: RuleSection[]) => {
      sections.forEach((sec) => {
        const titleMatch = sec.title.toLowerCase().includes(kw);
        const contentMatch = sec.content.some((c) => c.toLowerCase().includes(kw));
        if (titleMatch || contentMatch) {
          const matchText = titleMatch
            ? sec.title
            : sec.content.find((c) => c.toLowerCase().includes(kw)) || sec.title;
          results.push({ format, sectionId: sec.id, sectionTitle: sec.title, matchText });
        }
        if (sec.children) searchInSections(sec.children);
      });
    };
    searchInSections(data.treeContent);
    data.scoringSections.forEach((s) => {
      if (s.name.toLowerCase().includes(kw) || s.description.toLowerCase().includes(kw)) {
        results.push({ format, sectionId: s.id, sectionTitle: s.name, matchText: s.name + ' - ' + s.description });
      }
      s.subItems.forEach((sub) => {
        if (sub.name.toLowerCase().includes(kw) || sub.description.toLowerCase().includes(kw)) {
          results.push({ format, sectionId: sub.id, sectionTitle: sub.name, matchText: sub.name + ' - ' + sub.description });
        }
      });
    });
    data.tips.forEach((tip, idx) => {
      if (tip.toLowerCase().includes(kw)) {
        results.push({ format, sectionId: `tip-${idx}`, sectionTitle: '实用技巧', matchText: tip });
      }
    });
    data.commonMistakes.forEach((mistake, idx) => {
      if (mistake.toLowerCase().includes(kw)) {
        results.push({ format, sectionId: `mistake-${idx}`, sectionTitle: '常见误区', matchText: mistake });
      }
    });
    data.flowNodes.forEach((node) => {
      if (node.label.toLowerCase().includes(kw) || (node.description && node.description.toLowerCase().includes(kw))) {
        results.push({ format, sectionId: node.id, sectionTitle: '比赛流程', matchText: node.label + (node.description ? ' - ' + node.description : '') });
      }
    });
  });
  return results;
};
