import type { Topic, TopicCategory, TopicCategoryConfig, ClassificationSuggestion } from '@/types';

export const CATEGORY_CONFIGS: TopicCategoryConfig[] = [
  {
    name: '政策',
    label: '政策辩',
    color: 'text-navy-700',
    bgColor: 'bg-navy-50',
    ringColor: 'ring-navy-600/20',
    description: '围绕政策制度、法规条文、社会治理等议题展开',
    keywords: [
      '应该', '应当', '应当实行', '应该推行', '需要制定', '需要改革',
      '立法', '政策', '制度', '法规', '规定', '禁止', '允许', '放开',
      '限制', '监管', '推广', '实施', '废除', '修订', '推行',
      '义务教育', '医疗', '教育', '环保', '税收', '户籍', '社保',
      '公务员', '公务员考试', '高考', '大学', '学校', '住房', '房',
      '互联网', '数据', '隐私', '个人信息', '网络', '平台',
      '最低工资', '加班', '劳动', '就业', '退休', '养老金',
      '城市规划', '交通', '公共交通', '地铁', '汽车', '新能源',
      '食品', '药品', '疫苗', '医疗', '保险', '医保',
      '养', '狗', '宠物', '禁', '开', '设', '建',
    ],
    order: 1,
  },
  {
    name: '价值',
    label: '价值辩',
    color: 'text-gold-700',
    bgColor: 'bg-gold-50',
    ringColor: 'ring-gold-600/30',
    description: '围绕价值观念、道德伦理、人生哲学等议题展开',
    keywords: [
      '更重要', '更重要的事', '更', '还是', '比', '重于', '胜于', '优先于',
      '道德', '伦理', '正义', '公平', '自由', '平等', '尊严', '权利',
      '责任', '义务', '良心', '善良', '美好', '幸福', '快乐',
      '成功', '失败', '选择', '牺牲', '奉献', '坚守', '坚持',
      '个人', '集体', '社会', '国家', '民族', '人类', '世界',
      '理想', '现实', '梦想', '信念', '信仰', '价值', '意义',
      '爱情', '友情', '亲情', '家庭', '婚姻', '事业',
      '勇敢', '诚实', '忠诚', '智慧', '善良', '宽容',
      '过程', '结果', '目的', '手段', '方式', '态度',
      '应不应该', '值不值得', '好不好', '对不对',
    ],
    order: 2,
  },
  {
    name: '事实',
    label: '事实辩',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    ringColor: 'ring-emerald-600/20',
    description: '围绕客观事实、因果关系、发展趋势等议题展开',
    keywords: [
      '是否', '有没有', '会不会', '能不能', '是不是',
      '有利于', '不利于', '促进了', '阻碍了', '导致了',
      '发展', '趋势', '增长', '下降', '变化', '影响',
      '原因', '结果', '因素', '关系', '关联', '因果',
      '科技', '技术', '人工智能', 'AI', '机器人', '自动化',
      '经济', 'GDP', '市场', '竞争', '全球化', '贸易',
      '文化', '传统', '传承', '创新', '变革', '革命',
      '环境', '气候', '污染', '生态', '物种', '资源',
      '人口', '老龄化', '少子化', '城镇化', '迁移',
      '大数据', '算法', '区块链', '元宇宙', '5G',
    ],
    order: 3,
  },
  {
    name: '模拟法庭',
    label: '模拟法庭',
    color: 'text-red-700',
    bgColor: 'bg-red-50',
    ringColor: 'ring-red-600/20',
    description: '围绕法律案例、司法审判、法律适用等议题展开',
    keywords: [
      '有罪', '无罪', '判决', '裁定', '起诉', '辩护', '上诉',
      '犯罪', '违法', '侵权', '违约', '诈骗', '盗窃', '杀人',
      '法庭', '法官', '律师', '检察官', '陪审团', '审判',
      '民事', '刑事', '行政', '宪法', '合同', '产权',
      '证据', '证人', '证词', '鉴定', '举证', '质证',
      '正当防卫', '紧急避险', '故意', '过失', '自首',
      '死刑', '无期徒刑', '缓刑', '减刑', '假释',
      '赔偿', '补偿', '罚金', '没收', '追缴',
      '原告', '被告', '第三人', '代理人', '监护人',
      '抢劫', '绑架', '贩毒', '走私', '贪污', '受贿', '渎职',
    ],
    order: 4,
  },
];

const findCategoryConfig = (name: TopicCategory): TopicCategoryConfig => {
  return CATEGORY_CONFIGS.find((c) => c.name === name) ?? CATEGORY_CONFIGS[0];
};

const calculateCategoryScore = (text: string, category: TopicCategoryConfig): number => {
  const lowerText = text.toLowerCase();
  let score = 0;
  let matchedKeywords = 0;

  for (const keyword of category.keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      const lengthBonus = Math.min(keyword.length / 2, 3);
      score += 10 + lengthBonus;
      matchedKeywords++;
    }
  }

  if (matchedKeywords >= 3) score += 15;
  else if (matchedKeywords >= 2) score += 8;

  return score;
};

const detectQuestionPattern = (title: string): TopicCategory[] => {
  const suggestions: TopicCategory[] = [];

  if (/应该|应当|禁止|允许|放开|推行|实施|废除/.test(title)) {
    suggestions.push('政策');
  }

  if (/更重要|重于|胜于|优先于|值不值得|应不应该/.test(title)) {
    suggestions.push('价值');
  }

  if (/是否|有没有|会不会|能不能|是不是|有利于|导致了/.test(title)) {
    suggestions.push('事实');
  }

  if (/有罪|无罪|判决|犯罪|法庭|审判|正当防卫/.test(title)) {
    suggestions.push('模拟法庭');
  }

  return suggestions;
};

export const suggestClassification = (topic: Topic): ClassificationSuggestion => {
  const fullText = `${topic.title} ${topic.proSide} ${topic.conSide}`;
  const patternHints = detectQuestionPattern(topic.title);

  const scores: { category: TopicCategory; score: number }[] = CATEGORY_CONFIGS.map((config) => {
    const keywordScore = calculateCategoryScore(fullText, config);
    const patternBonus = patternHints.includes(config.name) ? 25 : 0;
    const existingBonus = topic.category.includes(config.name) ? 5 : 0;
    return {
      category: config.name,
      score: keywordScore + patternBonus + existingBonus,
    };
  });

  scores.sort((a, b) => b.score - a.score);

  const maxScore = scores[0].score;
  const threshold = Math.max(maxScore * 0.4, 15);

  const suggested = scores
    .filter((s) => s.score >= threshold && s.score > 0)
    .map((s) => s.category);

  if (suggested.length === 0) {
    suggested.push(scores[0].category);
  }

  const currentSet = new Set(topic.category);
  const newSuggestions = suggested.filter((c) => !currentSet.has(c));
  const missingCategories = topic.category.filter((c) => !suggested.includes(c));

  const reasons: string[] = [];
  const topCategory = scores[0];
  const topConfig = findCategoryConfig(topCategory.category);

  if (patternHints.length > 0) {
    reasons.push(`辩题表述符合${patternHints.map((h) => findCategoryConfig(h).label).join('、')}的提问模式`);
  }

  const matchedKw = topConfig.keywords.filter((kw) => fullText.includes(kw));
  if (matchedKw.length > 0) {
    reasons.push(`包含${topConfig.label}特征词：${matchedKw.slice(0, 3).join('、')}`);
  }

  if (newSuggestions.length > 0) {
    reasons.push(`建议新增分类：${newSuggestions.join('、')}`);
  }

  if (missingCategories.length > 0) {
    reasons.push(`当前分类「${missingCategories.join('、')}」与内容匹配度较低`);
  }

  const confidence = suggested.length > 0
    ? Math.min(95, Math.round((maxScore / Math.max(1, scores.reduce((sum, s) => sum + s.score, 0))) * 100 + maxScore * 0.5))
    : 0;

  return {
    topicId: topic.id,
    currentCategories: [...topic.category],
    suggestedCategories: suggested,
    confidence: Math.max(0, confidence),
    reasons,
  };
};

export const batchSuggestClassification = (topics: Topic[]): ClassificationSuggestion[] => {
  return topics
    .map((topic) => suggestClassification(topic))
    .filter((s) => {
      const currentSet = new Set(s.currentCategories);
      const hasNew = s.suggestedCategories.some((c) => !currentSet.has(c));
      const hasMissing = s.currentCategories.some((c) => !s.suggestedCategories.includes(c));
      return hasNew || hasMissing || s.confidence > 60;
    });
};

export const getCategoryConfig = findCategoryConfig;

export const getCategoryStats = (topics: Topic[]): Record<TopicCategory, { count: number; avgDifficulty: number }> => {
  const stats: Record<string, { count: number; totalDifficulty: number }> = {};
  CATEGORY_CONFIGS.forEach((c) => {
    stats[c.name] = { count: 0, totalDifficulty: 0 };
  });

  topics.forEach((t) => {
    t.category.forEach((cat) => {
      if (stats[cat]) {
        stats[cat].count++;
        stats[cat].totalDifficulty += t.difficulty;
      }
    });
  });

  const result = {} as Record<TopicCategory, { count: number; avgDifficulty: number }>;
  CATEGORY_CONFIGS.forEach((c) => {
    const s = stats[c.name];
    result[c.name] = {
      count: s.count,
      avgDifficulty: s.count > 0 ? Math.round((s.totalDifficulty / s.count) * 10) / 10 : 0,
    };
  });

  return result;
};
