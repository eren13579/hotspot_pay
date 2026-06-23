import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { cn } from '../../utils/cn'

/**
 * TicketDonut — Donut chart de répartition des tickets
 */
export default function TicketDonut({ data, isLight, containerCls }) {
  if (!data || data.length === 0) return null

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textSecondary = isLight ? 'text-slate-500' : 'text-slate-400'

  return (
    <div className={cn('rounded-2xl p-6', containerCls)}>
      <h3 className={cn('text-sm font-bold mb-4', textPrimary)}>Répartition des tickets</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className={cn('text-xs', textSecondary)}>Aucun ticket</p>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-36 h-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%" cy="50%"
                  innerRadius={32}
                  outerRadius={56}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isLight ? '#fff' : '#1e293b',
                    border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: isLight ? '#0f172a' : '#f1f5f9',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className={cn('text-[11px]', textSecondary)}>{d.name}</span>
                </span>
                <span className={cn('text-xs font-semibold', textPrimary)}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
