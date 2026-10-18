import { type ToothMeta, UPPER_TEETH, LOWER_TEETH } from '@/lib/fdi';
import type { ToothCondition } from '@/lib/types';
import type { ConditionDefinition } from '@/lib/types';

interface OdontogramProps {
  conditions: ToothCondition[];
  definitions: ConditionDefinition[];
  selectedTooth: number | null;
  onSelectTooth: (n: number) => void;
}

function condColor(code: string, defs: ConditionDefinition[]): string | null {
  const d = defs.find((x) => x.code === code);
  return d?.color ?? null;
}

function Tooth({
  meta,
  conds,
  defs,
  selected,
  onClick,
}: {
  meta: ToothMeta;
  conds: ToothCondition[];
  defs: ConditionDefinition[];
  selected: boolean;
  onClick: () => void;
}) {
  const top = conds.find((c) => !c.surface) ?? conds[0];
  const color = top ? condColor(top.condition, defs) : null;
  const ring = selected ? 'ring-2 ring-accent-500 ring-offset-1' : 'hover:ring-1 hover:ring-slate-300';

  // shape varies by tooth type for a clinical feel
  const shapeClass =
    meta.type === 'molar' ? 'rounded-md' :
    meta.type === 'premolar' ? 'rounded-lg' :
    meta.type === 'canine' ? 'rounded-[40%_60%_60%_40%]' :
    'rounded-full';

  return (
    <button
      type="button"
      onClick={onClick}
      title={`Tooth ${meta.number} — ${meta.type}`}
      className={`group flex flex-col items-center`}
    >
      <span
        className={`w-7 h-9 sm:w-8 sm:h-10 ${shapeClass} ${ring} border border-slate-300 bg-white transition-all relative`}
        style={color ? { backgroundColor: color, borderColor: color } : undefined}
      >
        {conds.length > 1 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-accent-600 text-white text-[9px] font-bold flex items-center justify-center">
            {conds.length}
          </span>
        )}
      </span>
      <span className="text-[10px] mt-1 text-slate-500 group-hover:text-slate-800 font-medium">{meta.number}</span>
    </button>
  );
}

export function Odontogram({ conditions, definitions, selectedTooth, onSelectTooth }: OdontogramProps) {
  const byTooth = (n: number) => conditions.filter((c) => c.tooth_number === n);

  const Row = ({ teeth }: { teeth: ToothMeta[] }) => (
    <div className="flex items-end justify-center gap-1 sm:gap-1.5 flex-wrap">
      {teeth.map((t) => (
        <Tooth
          key={t.number}
          meta={t}
          conds={byTooth(t.number)}
          defs={definitions}
          selected={selectedTooth === t.number}
          onClick={() => onSelectTooth(t.number)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="text-center text-[10px] uppercase tracking-widest text-slate-400 font-medium">Upper</div>
      <Row teeth={UPPER_TEETH} />
      <div className="h-px bg-slate-200 my-2" />
      <div className="text-center text-[10px] uppercase tracking-widest text-slate-400 font-medium">Lower</div>
      <Row teeth={LOWER_TEETH} />
      <div className="flex items-center justify-center gap-3 flex-wrap text-[10px] text-slate-500 mt-3 pt-3 border-t border-slate-100">
        {definitions.map((d) => (
          <span key={d.code} className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
