import { useState } from 'react'
import AdminStatsTab from '@/components/admin/AdminStatsTab'
import AdminUsersTab from '@/components/admin/AdminUsersTab'
import AdminTextsTab from '@/components/admin/AdminTextsTab'

type Tab = 'stats' | 'users' | 'texts'

function AdminPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stats', label: 'Статистика' },
    { id: 'users', label: 'Пользователи' },
    { id: 'texts', label: 'Тексты' },
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Админ-панель</h1>

      {/* Tabs */}
      <div className="border-b border-border mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-foreground-secondary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'stats' && <AdminStatsTab />}
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'texts' && <AdminTextsTab />}
      </div>
    </div>
  )
}

export default AdminPanel

