import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { Activity } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * SessionsChart — AreaChart des sessions par jour
 */
export default function SessionsChart({ chartData, activeSessions, isLight, containerCls }) {
  if (chartData.length === 0) return null

  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={cn('rounded-2xl p-6', containerCls)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className={cn('text-sm font-bold', textPrimary)}>Sessions</h3>
          <span className={cn(
            'inline-flex items-center gap-1 text-[11px] font-bold px-1.5 py-0.5 rounded-lg',
            'text-emerald-400 bg-emerald-500/10',
          )}>
            <Activity className="w-3 h-3" />
            {activeSessions || 0} actives
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className={cn('text-[10px]', textMuted)}>Sessions/jour</span>
        </span>
      </div>

      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
            <defs>
              <linearGradient id="sessionsGradDef" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#64748b' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: isLight ? '#94a3b8' : '#64748b' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: isLight ? '#fff' : '#1e293b',
                border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                borderRadius: '12px',
                fontSize: '12px',
                color: isLight ? '#0f172a' : '#f1f5f9',
              }}
              formatter={(v) => [v, 'Sessions']}
            />
            <Area type="monotone" dataKey="sessions" stroke="#22c55e" strokeWidth={2} fill="url(#sessionsGradDef)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
