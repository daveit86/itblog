import prisma from "@/lib/prisma"
import { authOptions } from "@/lib/auth"
import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { format } from "date-fns"

export default async function AuditLogPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'admin') {
    redirect('/auth/signin')
  }

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  })

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-green-600'
    if (action.includes('delete')) return 'text-red-600'
    if (action.includes('update') || action.includes('publish') || action.includes('unpublish')) return 'text-blue-600'
    if (action.includes('approve') || action.includes('disapprove')) return 'text-yellow-600'
    return 'text-gray-600'
  }

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return '➕'
    if (action.includes('delete')) return '🗑️'
    if (action.includes('publish')) return '📢'
    if (action.includes('unpublish')) return '🔇'
    if (action.includes('approve')) return '✅'
    if (action.includes('disapprove')) return '❌'
    return '📝'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track all administrative actions
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resource</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Details</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {format(log.createdAt, 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-foreground">{log.user?.name || 'Unknown'}</div>
                    <div className="text-xs text-muted-foreground">{log.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${getActionColor(log.action)}`}>
                      <span>{getActionIcon(log.action)}</span>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center gap-1">
                      <span className="text-muted-foreground">{log.resourceType}</span>
                      {log.resourceId && (
                        <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                          ({log.resourceId.slice(0, 8)}...)
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.details ? (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          View details
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                          {log.details}
                        </pre>
                      </details>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No audit logs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-sm text-muted-foreground">
        <p>Showing last 100 audit log entries. Logs are retained indefinitely.</p>
        <p className="mt-1">IP Address and User Agent are logged but not displayed for privacy.</p>
      </div>
    </div>
  )
}