import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { TrendingUp } from 'lucide-react'
import { cn } from '../../utils/cn'
import { formatXAF } from '../../utils/format'

/**
 * RevenueChart — BarChart des revenus avec tooltip
 */
export default function RevenueChart({ chartData, revenueGrowth, isLight, containerCls }) {
  const textPrimary = isLight ? 'text-slate-900' : 'text-white'
  const textMuted = isLight ? 'text-slate-400' : 'text-slate-500'

  return (
    <div className={cn('rounded-2xl p-6', containerCls)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <h3 className={cn('text-sm font-bold', textPrimary)}>Revenus</h3>
          {revenueGrowth !== null && (
            <span className={cn(
              'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-lg',
              revenueGrowth > 0
                ? 'text-emerald-400 bg-emerald-500/10'
                : revenueGrowth < 0
                  ? 'text-red-400 bg-red-500/10'
                  : 'text-slate-400 bg-slate-500/10',
            )}>
              <TrendingUp className={cn('w-3 h-3', revenueGrowth > 0 ? 'rotate-0' : revenueGrowth < 0 ? 'rotate-180' : 'opacity-50')} />
              {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}%
            </span>
          )}
        </div>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className={cn('text-[10px]', textMuted)}>XAF</span>
        </span>
      </div>

      <div className="h-48">
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className={cn('text-xs', textMuted)}>Aucune donnée pour cette période.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
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
                tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: isLight ? '#fff' : '#1e293b',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid #334155',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: isLight ? '#0f172a' : '#f1f5f9',
                }}
                formatter={(v) => [formatXAF(v), 'Revenu']}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
