import { AIDebateSettings, ChatMessage, AIDifficulty, AISide } from '@/types';
import { uid } from './scoringEngine';

interface AIResponseTemplate {
  openings: string[];
  arguments: string[];
  counterArguments: string[];
  conclusions: string[];
}

const proTemplates: Record<AIDifficulty, AIResponseTemplate> = {
  easy: {
    openings: [
      '我方认为，这个观点是合理的。',
      '站在我方立场，我们支持这个辩题。',
      '首先，我方想明确表达我们的立场——我们是支持的。',
    ],
    arguments: [
      '第一，这对大多数人来说是有益的。',
      '第二，从实际效果来看，这样做利大于弊。',
      '第三，有很多例子可以证明我们的观点。',
    ],
    counterArguments: [
      '对方的观点听起来有道理，但仔细想想并非如此。',
      '对方可能忽略了一些重要的事实。',
      '对方辩友的论证存在一些漏洞。',
    ],
    conclusions: [
      '综上所述，我方坚持认为这个立场是正确的。',
      '所以，我们的观点是站得住脚的。',
      '基于以上论述，我方立场明确。',
    ],
  },
  medium: {
    openings: [
      '尊敬的评委、对方辩友，我方认为该辩题的正方立场具有更强的现实意义与价值支撑。',
      '开宗明义，我方将从三个维度论证为何正方观点更具说服力。',
      '首先，请允许我方明确立场：我们坚定地支持正方观点，并将从学理与现实两个层面展开论述。',
    ],
    arguments: [
      '从价值层面来看，正方观点更符合社会发展的长远利益和人类的基本价值追求。',
      '从现实数据来看，大量案例和研究都支持我方的主张，具有充分的实证基础。',
      '从逻辑推演来看，正方的论证链条更加完整严密，能够自洽地解释现象并指导实践。',
    ],
    counterArguments: [
      '对方辩友的论证存在一个根本性的逻辑缺陷——他们混淆了相关性与因果性的关系。',
      '对方所举的例子看似有力，但实则是以偏概全，缺乏普遍意义上的代表性。',
      '对方的价值判断标准本身就值得商榷，如果按照对方的逻辑推而广之，会导致荒谬的结论。',
    ],
    conclusions: [
      '综上，无论是价值层面、现实层面还是逻辑层面，我方的论证都更为坚实有力。',
      '基于以上三点论证，我方坚持认为正方立场是正确且更具建设性的。',
      '恳请评委和各位能够看到我方论证的完整性与说服力，支持正方观点。',
    ],
  },
  hard: {
    openings: [
      '感谢主持人。开宗明义，概念先行。在展开我方立论之前，请允许我方首先对辩题中的核心概念进行清晰的界定……',
      '尊敬的评委、对方辩友，各位好。今天我方所持的立场是……我方将从本体论、认识论和价值论三个层面系统论证我方观点。',
      '在进入正式辩论之前，我方想先明确今天的论证框架与判断标准。我方认为，判断一个观点是否成立，应该看它是否满足以下三个标准……',
    ],
    arguments: [
      '第一，从学理渊源来看，我方观点有着深厚的理论基础。早在XX学者的研究中就已经指出……',
      '第二，从实证数据来看，根据权威机构发布的最新报告显示……这一数据充分佐证了我方的论断。',
      '第三，从历史纵深的维度来审视，人类社会的发展历程一再证明……我方观点的历史必然性。',
      '第四，从比较优势的角度分析，相比于对方可能提出的替代方案，我方主张的优势体现在……',
    ],
    counterArguments: [
      '对方辩友刚才的论述看似精彩，但实际上存在三处值得商榷的地方。第一……第二……第三……',
      '我方注意到对方在论证过程中使用了一个巧妙的偷换概念。请大家注意，对方所说的A和我们今天讨论的B并不是同一个概念。',
      '对方辩友的论证逻辑存在一个明显的滑坡谬误。从A推到B再推到C，每一步的推导都缺乏必然性的支撑。',
      '对方的论证采用了双重标准。在评判我方观点时使用的是一套标准，而在论证己方观点时使用的又是另一套标准。',
    ],
    conclusions: [
      '综上所述，我方从理论、现实、历史、比较四个维度系统论证了我方立场的正确性与优越性。',
      '基于以上对核心概念的厘清、对论证标准的确立、以及对方论证漏洞的揭示，我方坚持认为……',
      '在今天这场辩论的最后，我方想再次强调：判断一个观点是否正确，不应该看它是否动听，而应该看它是否经得起逻辑的推敲和事实的检验。而我方的观点，恰恰做到了这两点。',
    ],
  },
  expert: {
    openings: [
      '感谢主席，问候在场各位。在正式开始我方的系统论述之前，请允许我方先提出一个元问题：我们今天讨论这个辩题，究竟是在讨论什么？只有先回答了这个问题，我们后面的讨论才有意义。',
      '尊敬的评委、对方辩友，大家好。今天这个辩题看似简单，实则涉及到一个深刻的哲学分野——功利主义与义务论的争论、社群主义与自由主义的分歧、实证主义与规范主义的对峙。我方将试图站在一个更为整全的视角来审视这个问题。',
    ],
    arguments: [
      '我方的第一个论点是建构性的。基于罗尔斯的"无知之幕"思想实验，如果我们站在原初状态来审视这个问题……',
      '我方的第二个论点是经验性的。在过去的三十年里，学界对此问题已经积累了大量的实证研究。根据XX等人2023年发表在顶级期刊上的元分析研究，综合了127项相关研究的结果，发现……',
      '我方的第三个论点是规范性的。从道德哲学的角度来看，如果我们接受"人是目的而非手段"这一康德式的定言命令，那么……',
      '我方的第四个论点是实践性的。对方可能会说我方的主张过于理想化，但我方想指出，理想的价值恰恰在于它为现实提供了一个可欲的方向。正如韦伯所说……',
    ],
    counterArguments: [
      '对方辩友的论证非常精彩，但我方不得不指出，对方的整个论述都是建立在一个未经反思的前提之上的。这个前提就是……然而，这个前提本身是值得怀疑的。',
      '对方辩友刚才的反驳使用了一个非常经典的论证策略——归谬法。但是，我方认为对方的归谬是不成功的，因为……',
      '我方注意到对方辩友在论证中使用了大量的直觉泵。直觉泵虽然在修辞上很有力量，但在哲学论证中是需要谨慎使用的。因为我们的直觉很多时候是不可靠的。',
      '对方辩友的论证可以被重构为一个三段论：大前提是A，小前提是B，结论是C。我方认为对方的大前提A是不成立的。我方将从以下三个方面来反驳这个大前提……',
    ],
    conclusions: [
      '今天这场辩论，我们讨论的不只是一个简单的是非问题，而是一种价值选择、一种生活方式、一种对人类未来的想象。我方选择站在正方这一边，不是因为它简单，而是因为它正确；不是因为它轻松，而是因为它值得。',
      '在辩论的最后，我方想引用一句话来作结："……"。这句话也许可以很好地概括我方今天的立场。谢谢大家。',
      '综上，我方从元理论层面、规范层面、实证层面和实践层面对我方立场进行了全方位的论证，同时也揭示了对方论证中存在的根本性问题。因此，我方坚定地认为……',
    ],
  },
};

const conTemplates: Record<AIDifficulty, AIResponseTemplate> = {
  easy: {
    openings: [
      '我方认为，这个观点是有问题的。',
      '站在我方立场，我们反对这个辩题。',
      '首先，我方想明确表达我们的立场——我们是反对的。',
    ],
    arguments: [
      '第一，这可能会带来一些不好的影响。',
      '第二，从实际情况来看，这样做弊大于利。',
      '第三，有很多例子可以说明我们的观点。',
    ],
    counterArguments: [
      '对方的观点听起来不错，但实际情况并非如此。',
      '对方可能没有考虑到一些重要的因素。',
      '对方辩友的说法有一些问题。',
    ],
    conclusions: [
      '综上所述，我方坚持认为反方立场是对的。',
      '所以，我们的观点是有道理的。',
      '基于以上论述，我方立场明确。',
    ],
  },
  medium: {
    openings: [
      '尊敬的评委、对方辩友，我方认为该辩题的反方立场才是更具理性与审慎的选择。',
      '开宗明义，我方将从风险、成本和可行性三个方面论证为何反方观点更应被采纳。',
      '首先，请允许我方明确立场：我们持反方观点，并将从现实约束与长远影响两个维度展开论述。',
    ],
    arguments: [
      '从风险层面来看，正方的主张可能带来诸多不可预测的负面后果，这些风险是我们不能忽视的。',
      '从成本效益分析来看，正方方案的实施成本过高，而收益却并不确定，投入产出比堪忧。',
      '从现实可行性来看，正方的理想虽然美好，但在当前的社会条件下很难落地，有乌托邦之嫌。',
    ],
    counterArguments: [
      '对方辩友的论证过于乐观，他们只看到了好的一面，却选择性地忽略了潜在的风险和问题。',
      '对方所引用的数据和案例存在明显的 cherry-picking（择优挑选）问题，不能代表整体情况。',
      '对方的逻辑推导看似严密，但实际上建立在多个未经证实的假设之上，只要其中一个假设不成立，整个论证就会崩塌。',
    ],
    conclusions: [
      '综上，无论是风险评估、成本效益还是现实可行性，我方的反方立场都更为理性和审慎。',
      '基于以上三点论证，我方坚持认为反方立场是更负责任的选择。',
      '恳请评委和各位能够看到我方论证的务实性与前瞻性，支持反方观点。',
    ],
  },
  hard: {
    openings: [
      '感谢主持人。在我方展开论述之前，请允许我方先指出今天这个辩题中可能存在的一个陷阱——即正方很容易占据道德制高点，而反方则容易被贴上消极、保守的标签。但我方想告诉大家，审慎不等于保守，反思不等于反对。',
      '尊敬的评委、对方辩友，各位好。我方所持的反方立场，并非是要简单地说"不"，而是要在一个更为复杂的现实语境中，重新审视这个问题的多面性。我方将从预设批判、后果分析和替代方案三个层面展开。',
    ],
    arguments: [
      '第一，我方要对正方立场背后的预设进行反思。正方的整个论述实际上预设了……但这个预设本身就是需要被质疑的。',
      '第二，从社会后果的角度来分析，如果真的按照正方的方案去做，可能会引发一系列连锁反应。其中最值得警惕的是……',
      '第三，从制度演进的角度来看，任何变革都需要考虑路径依赖的问题。历史告诉我们，很多初衷良好的改革之所以失败，就是因为忽视了……',
      '第四，我方并不是只破不立。在指出正方方案的问题之后，我方也想提出一个更为务实和可行的替代方案……',
    ],
    counterArguments: [
      '对方辩友的论证框架非常精致，但精致不等于正确。我方想指出对方论证中的三个根本缺陷。其一……其二……其三……',
      '对方辩友刚才举了很多例子，但我方发现这些例子都有一个共同特点——它们都是特殊案例，而非普遍现象。用特殊来论证普遍，这在逻辑上是站不住脚的。',
      '对方在论证中使用了一个很巧妙的修辞策略——道德绑架。仿佛谁反对正方的观点，谁就是站在正义的对立面。但我方认为，真正的道德不是喊口号，而是对后果负责。',
      '对方辩友说我方是保守主义，但我方想回应的是：保守主义不一定是贬义词。在面对复杂的社会问题时，保持一定的审慎和保守，恰恰是理性的体现。',
    ],
    conclusions: [
      '综上所述，我方通过揭示正方的预设问题、分析可能的负面后果、指出制度演进的约束，并提出替代性的务实方案，充分论证了反方立场的合理性。',
      '基于以上对正方论证前提的批判、对后果的审慎评估、以及对替代方案的思考，我方坚持认为反方立场是更为理性和负责任的选择。',
      '在今天这场辩论的最后，我方想再次强调：好的辩论不是比谁的口号更响亮，而是比谁的思考更深刻、更周全。我方不敢说自己掌握了全部真理，但我方至少试图避免了简单化和极端化的思维陷阱。',
    ],
  },
  expert: {
    openings: [
      '感谢主席，问候在场各位。在回应正方的观点之前，我方想先提出一个方法论上的提醒：我们今天讨论的是一个复杂的社会问题，而复杂问题往往没有简单的答案。正方那种非黑即白的思维方式，本身可能就是问题的一部分。',
      '尊敬的评委、对方辩友，大家好。初听正方的立场，很多人可能会觉得很有吸引力——毕竟谁不向往一个更美好的世界呢？但是，美好愿望不等于现实可行，道德直觉不等于正确答案。今天，我方将试图站在一个更为冷静和克制的立场，来审视这个充满诱惑的主张。',
    ],
    arguments: [
      '我方的第一个反驳是认识论层面的。正方的整个论证都建立在一个理性主义的假设之上，即人类有能力认识和设计一个最优的社会方案。但是，从哈耶克的"知识的僭妄"到波普尔的"零星社会工程"，思想家们一再警告我们……',
      '我方的第二个反驳是政治经济学层面的。正方的方案听起来很好，但它忽略了一个核心问题——激励机制。一旦实施了正方的主张，人们的行为会发生怎样的变化？这些变化又会带来哪些意想不到的后果？根据公共选择理论……',
      '我方的第三个反驳是历史哲学层面的。对方辩友可能认为历史是线性进步的，只要我们方向正确就能到达理想的彼岸。但是，从伯克到黑格尔再到以赛亚·伯林，思想家们提醒我们要警惕……',
    ],
    counterArguments: [
      '对方辩友的论证非常雄辩，但我方不得不指出，对方的整个论述范式都是有问题的。对方使用的是一种理想理论（ideal theory）的方法，但现实政治恰恰是非理想的。在非理想的条件下讨论理想方案，本质上是一种错位。',
      '正方辩友刚才使用了一个非常精致的思想实验。思想实验固然有其价值，但它的局限性也很明显——它往往过于简化了现实的复杂性。用一个过于简化的模型来指导复杂的现实决策，这本身就是危险的。',
      '我方能理解正方辩友的道德热情。道德热情是可贵的，但仅有道德热情是不够的。好的意图可能导向坏的结果，这在历史上屡见不鲜。正如孟德斯鸠所说……',
    ],
    conclusions: [
      '今天这场辩论，实际上是两种思想传统的对话——建构理性与演进理性、理想主义与现实主义、积极自由与消极自由。我方并非要说正方完全错误，而是想说，事情没有那么简单。在我们激动地拥抱一个新主张之前，请先想一想：我们真的准备好了吗？',
      '在辩论的最后，我方想用一句格言来作结："通往地狱的道路，往往由善意铺就。"这句话不是要我们放弃追求美好，而是要我们在追求美好的时候，保持一份清醒和谦卑。谢谢大家。',
      '综上，我方从认识论、政治经济学和历史哲学三个层面对正方的立场进行了系统性的反思和批判。我们不是要否定正方的美好愿望，而是要提醒大家：在复杂的现实面前，保持审慎和克制，是一种更深沉的智慧。',
    ],
  },
};

const modeTone: Record<string, string> = {
  practice: '【练习模式】',
  challenge: '【挑战模式】',
  casual: '【闲聊模式】',
};

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAIResponse(
  settings: AIDebateSettings,
  messages: ChatMessage[],
  userInput: string
): string {
  const { difficulty, userSide, mode } = settings;
  const aiSide: AISide = userSide === 'pro' ? 'con' : 'pro';
  const templates = aiSide === 'pro' ? proTemplates[difficulty] : conTemplates[difficulty];

  const userMessageCount = messages.filter((m) => m.role === 'user').length + 1;
  const isFirstRound = userMessageCount <= 1;

  let response = '';
  const tone = modeTone[mode] || '';

  if (isFirstRound) {
    const opening = randomPick(templates.openings);
    const arg1 = randomPick(templates.arguments);
    const arg2 = randomPick(templates.arguments.filter((a) => a !== arg1));
    const conclusion = randomPick(templates.conclusions);

    response = [opening, '', arg1, '', arg2, '', conclusion].join('\n\n');
  } else {
    const counter1 = randomPick(templates.counterArguments);
    const counter2 = randomPick(templates.counterArguments.filter((a) => a !== counter1));
    const arg = randomPick(templates.arguments);
    const conclusion = randomPick(templates.conclusions);

    const userPoints = extractUserPoints(userInput);
    const pointResponse = generatePointResponse(userPoints, aiSide, difficulty);

    response = [
      `感谢对方辩友的精彩发言。针对您刚才提到的观点，我方有以下几点回应：`,
      '',
      `首先，关于您提到的"${userPoints[0] || '核心观点'}"，我方认为……`,
      '',
      counter1,
      '',
      `其次，您的论证中还存在一个值得商榷的地方——`,
      '',
      counter2,
      '',
      `更进一步，我方想补充说明的是：`,
      '',
      arg,
      '',
      pointResponse,
      '',
      conclusion,
    ].join('\n\n');
  }

  if (mode === 'casual') {
    response = tone + '\n\n' + response.replace(/尊敬的评委|对方辩友|评委/g, '朋友').replace(/我方/g, '我');
  }

  if (mode === 'challenge') {
    response = tone + '\n\n' + response;
  }

  if (mode === 'practice') {
    response = tone + '\n\n' + response + '\n\n---\n\n💡 练习提示：您可以尝试从逻辑、论据、价值三个层面来回应我的观点。';
  }

  return response;
}

function extractUserPoints(input: string): string[] {
  const cleaned = input.trim();
  if (!cleaned) return [];

  const sentences = cleaned.split(/[。！？.!?\n]+/).filter((s) => s.trim().length > 0);

  const points: string[] = [];
  const keywords = ['第一', '第二', '第三', '首先', '其次', '最后', '因为', '所以', '因此', '而且'];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 5 && trimmed.length < 30) {
      if (keywords.some((kw) => trimmed.startsWith(kw))) {
        points.push(trimmed);
      }
    }
  }

  if (points.length === 0 && sentences.length > 0) {
    const firstPoint = sentences[0].trim();
    points.push(firstPoint.length > 20 ? firstPoint.slice(0, 20) + '…' : firstPoint);
  }

  return points.slice(0, 3);
}

function generatePointResponse(points: string[], aiSide: AISide, difficulty: AIDifficulty): string {
  if (points.length === 0) return '此外，我方还想强调……';

  const responses: Record<AIDifficulty, string[]> = {
    easy: [
      '您说得有一定道理，但还不够全面。',
      '这个观点我方不能完全认同。',
      '这一点需要重新思考一下。',
    ],
    medium: [
      '您的这个论证看似有力，但仔细推敲之下，其实存在几个层面的问题。',
      '我方承认您的观点有一定的合理性，但这并不足以支撑您的整体立场。',
      '您的这个论述，恰恰印证了我方之前提出的观点——',
    ],
    hard: [
      '您刚才提出的这个论点非常有意思，但我方认为它在概念界定、逻辑推导和经验证据三个层面都还有待商榷。',
      '您的这个论证触及了问题的一个侧面，但如果将其作为论证您方立场的核心论据，恐怕还有以偏概全之嫌。',
      '感谢对方辩友提出这样一个有深度的观点。我方对此有不同的理解，我将从以下两个方面来回应……',
    ],
    expert: [
      '您的这个论证，可以被重构为一个经典的论证模式。在哲学史上，关于这个论证模式的讨论汗牛充栋。我方认为，您的论证版本存在一个根本性的困难——',
      '对方辩友的这个观点很有启发性，它让我想到了XX学者在XX著作中的论述。但是，如果我们沿着这个思路再往下走几步，就会发现……',
      '您提出的这个反驳，实际上是对我方立场的一个重要挑战。我需要承认，这是一个有分量的批评。但是，这个批评并非不可回应……',
    ],
  };

  return randomPick(responses[difficulty]);
}

export function generateOpeningMessage(settings: AIDebateSettings): ChatMessage {
  const { userSide, mode, difficulty, topic } = settings;
  const aiSide = userSide === 'pro' ? 'con' : 'pro';
  const aiSideLabel = aiSide === 'pro' ? '正方' : '反方';
  const userSideLabel = userSide === 'pro' ? '正方' : '反方';

  const difficultyLabels: Record<AIDifficulty, string> = {
    easy: '入门',
    medium: '中级',
    hard: '高级',
    expert: '专家',
  };

  const modeLabels: Record<string, string> = {
    practice: '练习模式',
    challenge: '挑战模式',
    casual: '休闲模式',
  };

  const opening = `欢迎来到AI辩论对手！\n\n📌 辩题：${topic}\n🎯 模式：${modeLabels[mode] || mode}\n⚔️ 难度：${difficultyLabels[difficulty]}\n🎭 您的立场：${userSideLabel}\n🤖 AI立场：${aiSideLabel}\n\n准备好了吗？请输入您的第一个论点，让我们开始辩论吧！`;

  return {
    id: uid(),
    role: 'system',
    content: opening,
    timestamp: Date.now(),
    side: aiSide,
  };
}

export function createChatMessage(
  role: ChatMessage['role'],
  content: string,
  side?: AISide
): ChatMessage {
  return {
    id: uid(),
    role,
    content,
    timestamp: Date.now(),
    side,
  };
}
