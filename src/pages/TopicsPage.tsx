import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Plus, Pencil, Trash2, BookOpen, Check, ChevronDown, BarChart3, GitBranch,
  CheckSquare, Square, Layers, Sparkles, X, AlertTriangle, Settings2, Tag,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import Modal from '@/components/ui/Modal';
import Empty from '@/components/ui/Empty';
import type { Topic, TopicCategory, DebateFormat, ClassificationSuggestion } from '@/types';
import { FORMAT_RULES } from '@/engines/formatRules';
import { CATEGORY_CONFIGS, batchSuggestClassification, getCategoryStats } from '@/engines/topicClassificationEngine';
import { cn } from '@/lib/utils';

const CATEGORIES: TopicCategory[] = ['政策', '价值', '事实', '模拟法庭'];
const CATEGORY_COLORS: Record<TopicCategory, string> = {
  政策: 'badge-blue', 价值: 'badge-gold', 事实: 'badge-green', 模拟法庭: 'badge-red',
};
const DIFFICULTY_COLORS: Record<TopicCategory, string> = {
  政策: 'bg-navy-50 text-navy-700 ring-navy-600/20',
  价值: 'bg-gold-50 text-gold-700 ring-gold-600/30',
  事实: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  模拟法庭: 'bg-red-50 text-red-700 ring-red-600/20',
};
const FORMAT_LIST: DebateFormat[] = ['parliamentary', 'mandarin', 'moot_court', 'british_parliamentary'];

interface ChipFilterProps {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}
function ChipFilter({ label, options, value, onChange }: ChipFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-medium text-navy-600">{label}：</span>
      <button onClick={() => onChange('')} className={cn(
        'rounded-full px-3 py-1 text-xs font-medium transition-all',
        value === '' ? 'bg-gradient-navy text-white shadow-card' : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
      )}>全部</button>
      {options.map((opt) => (
        <button key={opt} onClick={() => onChange(opt)} className={cn(
          'rounded-full px-3 py-1 text-xs font-medium transition-all',
          value === opt ? 'bg-gradient-navy text-white shadow-card' : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
        )}>{opt}</button>
      ))}
    </div>
  );
}

interface MultiSelectProps {
  label: string;
  options: { id: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}
function MultiSelect({ label, options, value, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  return (
    <div>
      <label className="label-base">{label}</label>
      <div className="relative">
        <button type="button" onClick={() => setOpen(!open)}
          className="input-base flex items-center justify-between text-left">
          <span className="truncate text-navy-400">{value.length > 0 ? `已选 ${value.length} 项` : '请选择'}</span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-navy-200 bg-white py-1 shadow-card scroll-thin">
            {options.map((opt) => (
              <button key={opt.id} type="button" onClick={() => toggle(opt.id)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-navy-700 hover:bg-navy-50">
                <div className={cn('flex h-4 w-4 items-center justify-center rounded border transition-colors',
                  value.includes(opt.id) ? 'border-navy-600 bg-gradient-navy text-white' : 'border-navy-300 bg-white')}>
                  {value.includes(opt.id) && <Check className="h-3 w-3" />}
                </div>
                <span className="truncate">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface TopicFormState {
  title: string; proSide: string; conSide: string;
  category: TopicCategory[]; formats: DebateFormat[]; difficulty: 1 | 2 | 3 | 4 | 5;
}

const emptyForm: TopicFormState = { title: '', proSide: '', conSide: '', category: [], formats: [], difficulty: 3 };

export default function TopicsPage() {
  const navigate = useNavigate();
  const { topics, addTopic, updateTopic, removeTopic, batchDeleteTopics, batchUpdateTopicCategory, applyClassificationSuggestions } = useDebateStore();
  const [keyword, setKeyword] = useState('');
  const [catFilter, setCatFilter] = useState<TopicCategory | ''>('');
  const [fmtFilter, setFmtFilter] = useState<DebateFormat | ''>('');
  const [diffFilter, setDiffFilter] = useState<number | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TopicFormState>(emptyForm);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [batchCategoryModalOpen, setBatchCategoryModalOpen] = useState(false);
  const [batchAddCats, setBatchAddCats] = useState<TopicCategory[]>([]);
  const [batchRemoveCats, setBatchRemoveCats] = useState<TopicCategory[]>([]);
  const [categoryPanelOpen, setCategoryPanelOpen] = useState(false);
  const [suggestionPanelOpen, setSuggestionPanelOpen] = useState(false);
  const [classificationSuggestions, setClassificationSuggestions] = useState<ClassificationSuggestion[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const categoryOptions = CATEGORIES.map((c) => ({ id: c, label: c }));
  const formatOptions = FORMAT_LIST.map((f) => ({ id: f, label: FORMAT_RULES[f].label }));

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return topics.filter((t) => {
      if (kw && !t.title.toLowerCase().includes(kw)) return false;
      if (catFilter && !t.category.includes(catFilter)) return false;
      if (fmtFilter && !t.formats.includes(fmtFilter)) return false;
      if (diffFilter !== '' && t.difficulty !== diffFilter) return false;
      return true;
    });
  }, [topics, keyword, catFilter, fmtFilter, diffFilter]);

  const categoryStats = useMemo(() => getCategoryStats(topics), [topics]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((t) => t.id)));
    }
  }, [filtered, selectedIds]);

  const exitBatchMode = useCallback(() => {
    setBatchMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmDeleteOpen(true);
  };

  const confirmBatchDelete = () => {
    batchDeleteTopics(Array.from(selectedIds));
    setConfirmDeleteOpen(false);
    exitBatchMode();
  };

  const handleBatchCategoryUpdate = () => {
    if (selectedIds.size === 0) return;
    setBatchAddCats([]);
    setBatchRemoveCats([]);
    setBatchCategoryModalOpen(true);
  };

  const applyBatchCategory = () => {
    batchUpdateTopicCategory(Array.from(selectedIds), batchAddCats, batchRemoveCats);
    setBatchCategoryModalOpen(false);
    exitBatchMode();
  };

  const [suggestionCheckedIds, setSuggestionCheckedIds] = useState<Set<string>>(new Set());

  const handleSuggestClassification = () => {
    const suggestions = batchSuggestClassification(topics);
    setClassificationSuggestions(suggestions);
    setSuggestionCheckedIds(new Set(suggestions.map((s) => s.topicId)));
    setSuggestionPanelOpen(true);
  };

  const applySuggestions = () => {
    const toApply = classificationSuggestions.filter((s) => suggestionCheckedIds.has(s.topicId));
    if (toApply.length === 0) return;
    applyClassificationSuggestions(toApply.map((s) => ({ topicId: s.topicId, suggestedCategories: s.suggestedCategories })));
    setSuggestionPanelOpen(false);
    setClassificationSuggestions([]);
    setSuggestionCheckedIds(new Set());
  };

  const topicTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    topics.forEach((t) => map.set(t.id, t.title));
    return map;
  }, [topics]);

  const openAdd = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (t: Topic) => {
    setEditingId(t.id);
    setForm({
      title: t.title, proSide: t.proSide, conSide: t.conSide,
      category: [...t.category], formats: [...t.formats], difficulty: t.difficulty,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.proSide.trim() || !form.conSide.trim()) return;
    if (form.category.length === 0 || form.formats.length === 0) return;
    const payload = {
      title: form.title.trim(), proSide: form.proSide.trim(), conSide: form.conSide.trim(),
      category: form.category, formats: form.formats, difficulty: form.difficulty,
    };
    if (editingId) { updateTopic(editingId, payload); } else { addTopic(payload); }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-navy text-white shadow-card">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-2xl font-bold text-navy-900">辩题库管理</h2>
            <p className="text-sm text-navy-500">共 {topics.length} 道辩题</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setCategoryPanelOpen(!categoryPanelOpen)} className={cn('btn-secondary', categoryPanelOpen && 'ring-2 ring-navy-400')}>
            <Layers className="h-4 w-4" />分类管理
          </button>
          <button onClick={handleSuggestClassification} className="btn-secondary">
            <Sparkles className="h-4 w-4" />智能分类
          </button>
          <button onClick={() => navigate('/topics/analytics')} className="btn-secondary">
            <BarChart3 className="h-4 w-4" />热度分析
          </button>
          {!batchMode ? (
            <button onClick={() => setBatchMode(true)} className="btn-secondary">
              <CheckSquare className="h-4 w-4" />批量操作
            </button>
          ) : (
            <button onClick={exitBatchMode} className="btn-secondary ring-2 ring-navy-400">
              <X className="h-4 w-4" />退出批量
            </button>
          )}
          <button onClick={openAdd} className="btn-primary">
            <Plus className="h-4 w-4" />新增辩题
          </button>
        </div>
      </div>

      {categoryPanelOpen && (
        <div className="card p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-navy-600" />
              <h3 className="font-serif text-lg font-bold text-navy-900">分类管理</h3>
            </div>
            <button onClick={() => setCategoryPanelOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORY_CONFIGS.map((config) => {
              const stat = categoryStats[config.name];
              return (
                <div key={config.name} className="rounded-xl border border-navy-100 p-4 hover:border-navy-300 transition-colors">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={cn('badge ring-1', DIFFICULTY_COLORS[config.name])}>{config.label}</span>
                    <span className="text-xs text-navy-400">{stat.count} 道辩题</span>
                  </div>
                  <p className="text-sm text-navy-600 mb-3">{config.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-navy-400">平均难度 ★{stat.avgDifficulty || '-'}</span>
                    <span className="text-navy-400">占比 {topics.length > 0 ? Math.round((stat.count / topics.length) * 100) : 0}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-navy-100 overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all',
                      config.name === '政策' ? 'bg-navy-500' : config.name === '价值' ? 'bg-gold-500' : config.name === '事实' ? 'bg-emerald-500' : 'bg-red-500',
                    )} style={{ width: `${topics.length > 0 ? (stat.count / topics.length) * 100 : 0}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {config.keywords.slice(0, 6).map((kw) => (
                      <span key={kw} className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[10px] text-navy-500">{kw}</span>
                    ))}
                    {config.keywords.length > 6 && (
                      <span className="rounded-md bg-navy-50 px-1.5 py-0.5 text-[10px] text-navy-400">+{config.keywords.length - 6}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {batchMode && (
        <div className="card p-4 border-2 border-navy-300 animate-fade-up">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-800 transition-colors">
                {selectedIds.size === filtered.length && filtered.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-navy-600" />
                ) : (
                  <Square className="h-5 w-5 text-navy-400" />
                )}
                <span className="font-medium">
                  {selectedIds.size > 0 ? `已选 ${selectedIds.size} 项` : '全选'}
                </span>
              </button>
              {selectedIds.size > 0 && (
                <span className="text-xs text-navy-400">/ 共 {filtered.length} 项</span>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={handleBatchCategoryUpdate}
                disabled={selectedIds.size === 0}
                className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  selectedIds.size > 0 ? 'bg-navy-50 text-navy-700 hover:bg-navy-100' : 'bg-navy-50/50 text-navy-300 cursor-not-allowed')}>
                <Tag className="h-3.5 w-3.5" />批量分类
              </button>
              <button onClick={handleBatchDelete}
                disabled={selectedIds.size === 0}
                className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all',
                  selectedIds.size > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-red-50/50 text-red-300 cursor-not-allowed')}>
                <Trash2 className="h-3.5 w-3.5" />批量删除
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-4 p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索辩题标题..." className="input-base pl-10" />
        </div>
        <ChipFilter label="分类" options={CATEGORIES} value={catFilter} onChange={(v) => setCatFilter(v as TopicCategory | '')} />
        <ChipFilter label="赛制" options={FORMAT_LIST.map((f) => FORMAT_RULES[f].label)}
          value={fmtFilter ? FORMAT_RULES[fmtFilter].label : ''}
          onChange={(v) => setFmtFilter(v ? (FORMAT_LIST.find((f) => FORMAT_RULES[f].label === v) as DebateFormat) : '')} />
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-navy-600">难度：</span>
          <button onClick={() => setDiffFilter('')} className={cn(
            'rounded-full px-3 py-1 text-xs font-medium transition-all',
            diffFilter === '' ? 'bg-gradient-navy text-white shadow-card' : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
          )}>全部</button>
          {[1, 2, 3, 4, 5].map((d) => (
            <button key={d} onClick={() => setDiffFilter(diffFilter === d ? '' : d)} className={cn(
              'rounded-full px-3 py-1 text-xs font-medium transition-all',
              diffFilter === d ? 'bg-gradient-navy text-white shadow-card' : 'bg-white text-navy-600 ring-1 ring-navy-200 hover:bg-navy-50',
            )}>★{d}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <Empty title={keyword || catFilter || fmtFilter || diffFilter !== '' ? '未找到匹配的辩题' : '暂无辩题'}
            description="请调整筛选条件或添加新辩题" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((t) => {
            const isSelected = selectedIds.has(t.id);
            return (
              <div key={t.id} className={cn('card p-6 group animate-fade-up transition-all',
                batchMode && isSelected && 'ring-2 ring-navy-400 bg-navy-50/30',
                batchMode && 'cursor-pointer',
              )} onClick={batchMode ? () => toggleSelect(t.id) : undefined}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    {batchMode && (
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(t.id); }} className="mt-1 flex-shrink-0">
                        {isSelected ? (
                          <CheckSquare className="h-5 w-5 text-navy-600" />
                        ) : (
                          <Square className="h-5 w-5 text-navy-300" />
                        )}
                      </button>
                    )}
                    <h3 className="flex-1 font-serif text-lg font-bold leading-snug text-navy-900">{t.title}</h3>
                  </div>
                  {!batchMode && (
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={() => openEdit(t)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-navy-500 transition-colors hover:bg-navy-50 hover:text-navy-700" aria-label="编辑">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeTopic(t.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-600" aria-label="删除">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="mb-4 space-y-2.5 rounded-xl bg-gradient-to-br from-ivory-50 to-ivory-100 p-4 ring-1 ring-navy-100/50">
                  <div className="flex gap-2 text-sm">
                    <span className="shrink-0 font-medium text-navy-600">正方：</span>
                    <span className="text-navy-800">{t.proSide}</span>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <span className="shrink-0 font-medium text-navy-600">反方：</span>
                    <span className="text-navy-800">{t.conSide}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {t.category.map((c) => (
                      <span key={c} className={cn('badge ring-1', CATEGORY_COLORS[c], DIFFICULTY_COLORS[c])}>{c}</span>
                    ))}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {t.formats.map((f) => (
                      <span key={f} className="badge bg-navy-50 text-navy-600 ring-1 ring-navy-200/50 text-[11px]">
                        {FORMAT_RULES[f].label}
                      </span>
                    ))}
                  </div>
                  {!batchMode && (
                    <button
                      onClick={() => navigate(`/topics/${t.id}`)}
                      className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-gradient-navy px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
                    >
                      <GitBranch className="h-3.5 w-3.5" />
                      论点树
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editingId ? '编辑辩题' : '新增辩题'}
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">取消</button>
          <button onClick={handleSubmit} className="btn-primary"
            disabled={!form.title.trim() || !form.proSide.trim() || !form.conSide.trim() || form.category.length === 0 || form.formats.length === 0}>
            {editingId ? '保存修改' : '确认添加'}
          </button>
        </>}>
        <div className="space-y-4">
          <div>
            <label className="label-base">辩题标题</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入辩题标题" className="input-base" />
          </div>
          <div>
            <label className="label-base">正方立场</label>
            <input value={form.proSide} onChange={(e) => setForm({ ...form, proSide: e.target.value })}
              placeholder="正方主张..." className="input-base" />
          </div>
          <div>
            <label className="label-base">反方立场</label>
            <input value={form.conSide} onChange={(e) => setForm({ ...form, conSide: e.target.value })}
              placeholder="反方主张..." className="input-base" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <MultiSelect label="分类（多选）" options={categoryOptions} value={form.category}
              onChange={(v) => setForm({ ...form, category: v as TopicCategory[] })} />
            <MultiSelect label="适用赛制（多选）" options={formatOptions} value={form.formats}
              onChange={(v) => setForm({ ...form, formats: v as DebateFormat[] })} />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label-base mb-0">难度等级</label>
              <span className="text-sm font-semibold text-gold-600">★ {form.difficulty}</span>
            </div>
            <input type="range" min={1} max={5} step={1} value={form.difficulty}
              onChange={(e) => setForm({ ...form, difficulty: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
              className="range-slider" />
            <div className="mt-2 flex justify-between text-xs text-navy-400">
              <span>简单</span><span>中等</span><span>困难</span>
            </div>
          </div>
        </div>
      </Modal>

      <Modal open={batchCategoryModalOpen} onClose={() => setBatchCategoryModalOpen(false)}
        title="批量修改分类"
        footer={<>
          <button onClick={() => setBatchCategoryModalOpen(false)} className="btn-secondary">取消</button>
          <button onClick={applyBatchCategory} className="btn-primary"
            disabled={batchAddCats.length === 0 && batchRemoveCats.length === 0}>
            应用到 {selectedIds.size} 道辩题
          </button>
        </>}>
        <div className="space-y-5">
          <p className="text-sm text-navy-500">
            对已选的 <span className="font-semibold text-navy-700">{selectedIds.size}</span> 道辩题进行分类调整：
          </p>
          <div>
            <label className="label-base mb-2">添加分类</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = batchAddCats.includes(cat);
                return (
                  <button key={cat} onClick={() => setBatchAddCats(selected ? batchAddCats.filter((c) => c !== cat) : [...batchAddCats, cat])}
                    className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      selected ? 'bg-gradient-navy text-white shadow-sm' : 'bg-navy-50 text-navy-600 hover:bg-navy-100 ring-1 ring-navy-200')}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="label-base mb-2">移除分类</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => {
                const selected = batchRemoveCats.includes(cat);
                return (
                  <button key={cat} onClick={() => setBatchRemoveCats(selected ? batchRemoveCats.filter((c) => c !== cat) : [...batchRemoveCats, cat])}
                    className={cn('rounded-lg px-3 py-2 text-sm font-medium transition-all',
                      selected ? 'bg-red-500 text-white shadow-sm' : 'bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200')}>
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
          {batchAddCats.length > 0 && batchRemoveCats.length > 0 && (
            <div className="rounded-lg bg-ivory-50 p-3 ring-1 ring-navy-100">
              <p className="text-xs text-navy-600">
                操作预览：为 {selectedIds.size} 道辩题添加「{batchAddCats.join('、')}」分类，移除「{batchRemoveCats.join('、')}」分类
              </p>
            </div>
          )}
        </div>
      </Modal>

      <Modal open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}
        title="确认批量删除"
        footer={<>
          <button onClick={() => setConfirmDeleteOpen(false)} className="btn-secondary">取消</button>
          <button onClick={confirmBatchDelete} className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors">
            <Trash2 className="h-4 w-4" />确认删除
          </button>
        </>}>
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-red-50 p-4 ring-1 ring-red-200">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              即将删除 <span className="font-bold">{selectedIds.size}</span> 道辩题，此操作不可撤销！
            </p>
          </div>
        </div>
      </Modal>

      <Modal open={suggestionPanelOpen} onClose={() => { setSuggestionPanelOpen(false); setClassificationSuggestions([]); setSuggestionCheckedIds(new Set()); }}
        title="智能分类建议"
        footer={<>
          <button onClick={() => { setSuggestionPanelOpen(false); setClassificationSuggestions([]); setSuggestionCheckedIds(new Set()); }} className="btn-secondary">关闭</button>
          <button onClick={applySuggestions}
            disabled={suggestionCheckedIds.size === 0}
            className={cn('flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors',
              suggestionCheckedIds.size > 0 ? 'bg-gradient-navy text-white hover:opacity-90' : 'bg-navy-100 text-navy-400 cursor-not-allowed')}>
            <Sparkles className="h-4 w-4" />
            应用选中建议 ({suggestionCheckedIds.size})
          </button>
        </>}>
        <div className="space-y-4">
          <p className="text-sm text-navy-500">
            系统根据辩题标题和立场内容，为 <span className="font-semibold text-navy-700">{classificationSuggestions.length}</span> 道辩题生成了分类建议：
          </p>
          {classificationSuggestions.length === 0 ? (
            <div className="py-8 text-center text-navy-400 text-sm">所有辩题分类已准确，暂无优化建议</div>
          ) : (
            <SuggestionList suggestions={classificationSuggestions} checkedIds={suggestionCheckedIds} setCheckedIds={setSuggestionCheckedIds} topicTitleMap={topicTitleMap} />
          )}
        </div>
      </Modal>
    </div>
  );
}

function SuggestionList({ suggestions, checkedIds, setCheckedIds, topicTitleMap }: {
  suggestions: ClassificationSuggestion[];
  checkedIds: Set<string>;
  setCheckedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  topicTitleMap: Map<string, string>;
}) {
  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (checkedIds.size === suggestions.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(suggestions.map((s) => s.topicId)));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-navy-600 hover:text-navy-800">
          {checkedIds.size === suggestions.length ? (
            <CheckSquare className="h-4 w-4 text-navy-600" />
          ) : (
            <Square className="h-4 w-4 text-navy-400" />
          )}
          <span>全选 ({checkedIds.size}/{suggestions.length})</span>
        </button>
      </div>
      <div className="max-h-[400px] overflow-y-auto space-y-2 scroll-thin">
        {suggestions.map((s) => {
          const isChecked = checkedIds.has(s.topicId);
          const addedCats = s.suggestedCategories.filter((c) => !s.currentCategories.includes(c));
          const removedCats = s.currentCategories.filter((c) => !s.suggestedCategories.includes(c));
          const title = topicTitleMap.get(s.topicId) ?? s.topicId;
          return (
            <div key={s.topicId} className={cn(
              'rounded-xl border p-3 transition-all',
              isChecked ? 'border-navy-300 bg-navy-50/30' : 'border-navy-100 bg-white opacity-60',
            )}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleCheck(s.topicId)} className="mt-0.5 flex-shrink-0">
                  {isChecked ? <CheckSquare className="h-4 w-4 text-navy-600" /> : <Square className="h-4 w-4 text-navy-300" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium text-navy-800 truncate">{title}</span>
                    <span className={cn('badge text-[10px]',
                      s.confidence >= 80 ? 'bg-emerald-50 text-emerald-700' : s.confidence >= 50 ? 'bg-gold-50 text-gold-700' : 'bg-navy-50 text-navy-600',
                    )}>
                      置信度 {s.confidence}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs flex-wrap">
                    <span className="text-navy-400">当前：</span>
                    {s.currentCategories.map((c) => (
                      <span key={c} className={cn('badge ring-1', DIFFICULTY_COLORS[c])}>{c}</span>
                    ))}
                    <span className="text-navy-300">→</span>
                    <span className="text-navy-400">建议：</span>
                    {s.suggestedCategories.map((c) => {
                      const isAdded = addedCats.includes(c);
                      return (
                        <span key={c} className={cn('badge ring-1',
                          isAdded ? 'bg-emerald-50 text-emerald-700 ring-emerald-300' : DIFFICULTY_COLORS[c],
                        )}>
                          {isAdded && '+ '}{c}
                        </span>
                      );
                    })}
                    {removedCats.map((c) => (
                      <span key={c} className="badge bg-red-50 text-red-500 ring-1 ring-red-200 line-through opacity-60">
                        {c}
                      </span>
                    ))}
                  </div>
                  {s.reasons.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {s.reasons.map((r, i) => (
                        <span key={i} className="inline-flex items-center gap-1 rounded-full bg-ivory-50 px-2 py-0.5 text-[10px] text-navy-500 ring-1 ring-navy-100">
                          <Sparkles className="h-2.5 w-2.5 text-gold-400" />{r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
