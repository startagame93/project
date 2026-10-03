import { useMemo, useState } from 'react';
import { ArrowLeft, Search, Check } from 'lucide-react';
import { WORKOUT_DATABASE, WORKOUT_GROUPS, EQUIPMENT, type WorkoutDef } from '@/lib/exerciseLibrary';

const GROUP_COUNTS = WORKOUT_DATABASE.reduce<Record<string, number>>((acc, w) => {
  acc[w.category] = (acc[w.category] ?? 0) + 1;
  return acc;
}, {});

export function ExercisePicker({ selected, onSelect }: { selected: WorkoutDef | null; onSelect: (w: WorkoutDef) => void }) {
  const [group, setGroup] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState<string>('all');

  const q = search.toLowerCase().trim();
  const results = useMemo(() => {
    let list = WORKOUT_DATABASE;
    if (group) list = list.filter((w) => w.category === group);
    if (equipment !== 'all') list = list.filter((w) => w.equipment === equipment);
    if (q) list = list.filter((w) => w.name.toLowerCase().includes(q) || w.category.toLowerCase().includes(q));
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [group, equipment, q]);

  const groupEquipment = useMemo(() => {
    if (!group) return [];
    const set = new Set(WORKOUT_DATABASE.filter((w) => w.category === group && w.equipment).map((w) => w.equipment as string));
    return Object.values(EQUIPMENT).filter((e) => set.has(e));
  }, [group]);

  const showList = !!group || !!q;
  const strengthGroups = WORKOUT_GROUPS.filter((g) => g.strength);
  const activityGroups = WORKOUT_GROUPS.filter((g) => !g.strength);

  function openGroup(label: string) {
    setGroup(label);
    setEquipment('all');
  }

  function back() {
    setGroup(null);
    setSearch('');
    setEquipment('all');
  }

  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3">
        {showList && (
          <button onClick={back} className="p-2 -ml-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Torna ai gruppi">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        )}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input pl-10"
            placeholder={group ? `Cerca in ${group}...` : `Cerca tra ${WORKOUT_DATABASE.length} esercizi...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {!showList ? (
        <div className="animate-fade-in">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Gruppi muscolari</p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {strengthGroups.map((g) => (
              <GroupTile key={g.label} label={g.label} emoji={g.emoji} count={GROUP_COUNTS[g.label] ?? 0} onClick={() => openGroup(g.label)} />
            ))}
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Cardio e sport</p>
          <div className="grid grid-cols-3 gap-2">
            {activityGroups.map((g) => (
              <GroupTile key={g.label} label={g.label} emoji={g.emoji} count={GROUP_COUNTS[g.label] ?? 0} onClick={() => openGroup(g.label)} />
            ))}
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          {groupEquipment.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-1 -mx-1 px-1 scrollbar-none">
              {['all', ...groupEquipment].map((e) => (
                <button
                  key={e}
                  onClick={() => setEquipment(e)}
                  className={`chip shrink-0 transition-colors ${equipment === e ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  {e === 'all' ? 'Tutti' : e}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mb-2">{results.length} esercizi{group ? ` in ${group}` : ''}</p>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {results.map((w) => {
              const active = selected?.name === w.name;
              return (
                <button
                  key={w.name}
                  onClick={() => onSelect(w)}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                    active
                      ? 'bg-primary-100 dark:bg-primary-900/30 ring-1 ring-primary-400'
                      : 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-xl shrink-0 w-8 text-center">{w.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{w.name}</p>
                    <p className="text-xs text-gray-500">{w.equipment ? `${w.category} - ${w.equipment}` : w.category}</p>
                  </div>
                  {active && <Check className="w-4 h-4 text-primary-600 shrink-0" />}
                </button>
              );
            })}
            {results.length === 0 && <p className="text-sm text-gray-500 text-center py-6">Nessun esercizio trovato.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupTile({ label, emoji, count, onClick }: { label: string; emoji: string; count: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs font-semibold text-gray-900 dark:text-white text-center leading-tight">{label}</span>
      <span className="text-[10px] text-gray-500">{count}</span>
    </button>
  );
}
