import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Users,
  Trash2,
  X,
} from 'lucide-react';
import { useDebateStore } from '@/store/debateStore';
import { uid } from '@/engines/scoringEngine';
import TeamCard from '@/components/cards/TeamCard';
import Modal from '@/components/ui/Modal';
import Empty from '@/components/ui/Empty';
import type { Team, Player } from '@/types';

type PlayerRole = Player['role'];
const ROLES: PlayerRole[] = ['一辩', '二辩', '三辩', '四辩'];

interface FormPlayer {
  name: string;
  role: PlayerRole;
  contact: string;
}

function createEmptyPlayers(): FormPlayer[] {
  return ROLES.map((r) => ({ name: '', role: r, contact: '' }));
}

export default function TeamsPage() {
  const teams = useDebateStore((s) => s.teams);
  const addTeam = useDebateStore((s) => s.addTeam);
  const updateTeam = useDebateStore((s) => s.updateTeam);
  const removeTeam = useDebateStore((s) => s.removeTeam);

  const [keyword, setKeyword] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [institution, setInstitution] = useState('');
  const [seed, setSeed] = useState<number>(1);
  const [players, setPlayers] = useState<FormPlayer[]>(createEmptyPlayers());
  const [confirmDel, setConfirmDel] = useState<Team | null>(null);

  const validTeams = useMemo(() => teams.filter((t) => !t.id.startsWith('__')), [teams]);

  const filtered = useMemo(() => {
    const k = keyword.trim().toLowerCase();
    if (!k) return validTeams;
    return validTeams.filter(
      (t) =>
        t.name.toLowerCase().includes(k) ||
        t.institution.toLowerCase().includes(k) ||
        t.players.some((p) => p.name.toLowerCase().includes(k))
    );
  }, [validTeams, keyword]);

  const openAdd = () => {
    setEditingId(null);
    setTeamName('');
    setInstitution('');
    setSeed(validTeams.length + 1);
    setPlayers(createEmptyPlayers());
    setModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setEditingId(team.id);
    setTeamName(team.name);
    setInstitution(team.institution);
    setSeed(team.seed);
    const main = team.players.filter((p) => p.role !== '替补');
    setPlayers(
      ROLES.map((r, i) => {
        const found = main[i];
        return {
          name: found?.name ?? '',
          role: (found?.role ?? r) as PlayerRole,
          contact: found?.contact ?? '',
        };
      })
    );
    setModalOpen(true);
  };

  const canSubmit =
    teamName.trim() &&
    institution.trim() &&
    players.filter((p) => p.name.trim()).length >= 1;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const validPlayers = players
      .filter((p) => p.name.trim())
      .map<Player>((p) => ({
        id: uid(),
        name: p.name.trim(),
        role: p.role,
        contact: p.contact.trim() || undefined,
        scores: [],
      }));
    if (editingId) {
      const existing = teams.find((t) => t.id === editingId);
      const subs = existing?.players.filter((p) => p.role === '替补') ?? [];
      updateTeam(editingId, {
        name: teamName.trim(),
        institution: institution.trim(),
        seed,
        players: [...validPlayers, ...subs],
      });
    } else {
      addTeam({
        name: teamName.trim(),
        institution: institution.trim(),
        seed,
        players: validPlayers,
      });
    }
    setModalOpen(false);
  };

  const confirmDelete = (t: Team) => setConfirmDel(t);
  const doDelete = () => {
    if (confirmDel) removeTeam(confirmDel.id);
    setConfirmDel(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-navy-900 flex items-center gap-2">
            <Users className="w-7 h-7 text-gold-500" />队伍管理
          </h1>
          <p className="mt-1 text-sm text-navy-500">
            共 {validTeams.length} 支队伍，已筛选 {filtered.length} 支
          </p>
        </div>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索队伍名、学校或选手姓名..."
            className="input-base pl-10"
          />
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" />新增队伍
          </button>
          <button className="btn-secondary">
            <Upload className="w-4 h-4" />批量导入
          </button>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger-fade-in">
          {filtered.map((t) => (
            <TeamCard
              key={t.id}
              team={t}
              onEdit={openEdit}
              onDelete={confirmDelete}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={<Users className="h-10 w-10" strokeWidth={1.5} />}
          title={keyword ? '未找到匹配的队伍' : '暂无队伍'}
          description={keyword ? '试试其他关键词，或检查拼写是否正确。' : '点击右上角按钮添加第一支队伍开始吧！'}
          action={
            !keyword && (
              <button onClick={openAdd} className="btn-primary">
                <Plus className="w-4 h-4" />新增队伍
              </button>
            )
          }
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? '编辑队伍' : '新增队伍'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">
              取消
            </button>
            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
              {editingId ? '保存修改' : '创建队伍'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label-base">队伍名称 <span className="text-red-500">*</span></label>
            <input
              className="input-base"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="例如：思辨先锋队"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-base">所属学校 <span className="text-red-500">*</span></label>
              <input
                className="input-base"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="例如：清华大学"
              />
            </div>
            <div>
              <label className="label-base">种子排位</label>
              <input
                type="number"
                min={1}
                className="input-base"
                value={seed}
                onChange={(e) => setSeed(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label-base mb-0">选手名单（至少 1 名）</label>
              <span className="text-xs text-navy-400">{players.filter(p => p.name.trim()).length}/4 已填写</span>
            </div>
            <div className="space-y-2.5">
              {players.map((p, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[70px_1fr_1fr] gap-2 items-center rounded-xl bg-ivory-50 p-2.5 ring-1 ring-navy-100"
                >
                  <select
                    className="input-base text-xs py-2 px-2"
                    value={p.role}
                    onChange={(e) => {
                      const next = [...players];
                      next[idx] = { ...p, role: e.target.value as PlayerRole };
                      setPlayers(next);
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                  <input
                    className="input-base py-2 px-3"
                    value={p.name}
                    onChange={(e) => {
                      const next = [...players];
                      next[idx] = { ...p, name: e.target.value };
                      setPlayers(next);
                    }}
                    placeholder={`选手 ${idx + 1} 姓名`}
                  />
                  <input
                    className="input-base py-2 px-3"
                    value={p.contact}
                    onChange={(e) => {
                      const next = [...players];
                      next[idx] = { ...p, contact: e.target.value };
                      setPlayers(next);
                    }}
                    placeholder="联系方式"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDel}
        onClose={() => setConfirmDel(null)}
        title="确认删除"
        footer={
          <>
            <button onClick={() => setConfirmDel(null)} className="btn-secondary">
              取消
            </button>
            <button onClick={doDelete} className="btn-danger">
              <Trash2 className="w-4 h-4" />确认删除
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3 py-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
            <X className="h-5 w-5" />
          </div>
          <div>
            <p className="font-medium text-navy-800 mb-1">
              确定要删除队伍「{confirmDel?.name}」吗？
            </p>
            <p className="text-sm text-navy-500">
              删除后无法恢复，相关比赛数据也可能受到影响。
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
