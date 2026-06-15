'use client'

import { useProfile } from '@/hooks/useProfile'
import { useTodayTasks } from '@/hooks/useTodayTasks'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Skeleton, SkeletonStats, SkeletonTable } from '@/components/shared/Skeleton'

export default function DashboardPage() {
  const { profile, loading: profileLoading } = useProfile()
  const { tasks, loading: tasksLoading } = useTodayTasks(profile?.id)

  const greeting = getGreeting()
  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const today = formatDate(new Date().toISOString())

  if (profileLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>

      {/* Header */}
      <div
        className="bg-white px-4 pt-4 pb-4 border-b"
        style={{ borderColor: '#EEEEEE' }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#BBBBBB' }}>
              {today}
            </p>
            <h1 className="text-lg font-semibold mt-0.5" style={{ color: '#111111' }}>
              {greeting}, {firstName}
            </h1>
          </div>
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center md:hidden"
            style={{ backgroundColor: '#E4E9FA' }}
          >
            <span className="text-xs font-bold" style={{ color: '#00236F' }}>
              {getInitials(profile?.full_name ?? '')}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Report due banner */}
        <ReportDueBanner />

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Active BOQ sections"
            value="2"
            sublabel="of 4 total"
          />
          <StatCard
            label="Workers logged"
            value="14"
            sublabel="yesterday"
          />
        </div>

        {/* Today's tasks */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: '#BBBBBB' }}
            >
              Tasks due today
            </h2>
            <Link
              href="/tasks"
              className="text-xs font-semibold"
              style={{ color: '#00236F' }}
            >
              View all
            </Link>
          </div>

          {tasksLoading ? (
            <TasksSkeleton />
          ) : tasks.length === 0 ? (
            <div
              className="bg-white rounded-xl p-5 text-center border"
              style={{ borderColor: '#EEEEEE' }}
            >
              <p className="text-sm font-medium" style={{ color: '#111111' }}>
                No tasks due today
              </p>
              <p className="text-xs mt-1" style={{ color: '#BBBBBB' }}>
                Your project manager has not assigned any tasks yet. If you loaded the demo project, check your Tasks tab.
              </p>
            </div>
          ) : (
            <div
              className="bg-white rounded-xl border overflow-hidden"
              style={{ borderColor: '#EEEEEE' }}
            >
              {tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  isLast={index === tasks.length - 1}
                />
              ))}
            </div>
          )}
        </div>

        {/* Submit report CTA */}
        <Link
          href="/report/new"
          className="block w-full py-4 rounded-xl text-sm font-semibold text-white text-center transition-opacity active:opacity-80"
          style={{ backgroundColor: '#00236F' }}
        >
          Submit today's report
        </Link>

      </div>
    </div>
  )
}

function ReportDueBanner() {
  const now = new Date()
  const hour = now.getHours()
  const isLate = hour >= 16

  return (
    <div
      className="rounded-xl px-4 py-3.5 border"
      style={{
        backgroundColor: isLate ? '#FFF5F5' : '#E4E9FA',
        borderColor: isLate ? '#E24B4A' : '#C8D4F8',
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: isLate ? '#B91C1C' : '#00236F' }}
      >
        {isLate
          ? 'Report overdue -- submit now'
          : 'Daily report due before 5:00 PM'}
      </p>
      <p
        className="text-xs mt-0.5"
        style={{ color: isLate ? '#EF4444' : '#778EDE' }}
      >
        {isLate
          ? 'Your project manager is waiting for your update'
          : 'Tap the button below when you are ready'}
      </p>
    </div>
  )
}

function StatCard({
  label,
  value,
  sublabel,
}: {
  label: string
  value: string
  sublabel: string
}) {
  return (
    <div
      className="bg-white rounded-xl p-4 border"
      style={{ borderColor: '#EEEEEE' }}
    >
      <p
        className="text-2xl font-semibold"
        style={{ color: '#00236F' }}
      >
        {value}
      </p>
      <p
        className="text-xs font-medium mt-0.5"
        style={{ color: '#111111' }}
      >
        {label}
      </p>
      <p
        className="text-xs mt-0.5"
        style={{ color: '#BBBBBB' }}
      >
        {sublabel}
      </p>
    </div>
  )
}

function TaskItem({
  task,
  isLast,
}: {
  task: { id: string; title: string; due_date: string; status: string }
  isLast: boolean
}) {
  const isOverdue =
    new Date(task.due_date) < new Date() && task.status !== 'done'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${!isLast ? 'border-b' : ''}`}
      style={{ borderColor: '#EEEEEE' }}
    >
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{
          backgroundColor:
            task.status === 'in_progress'
              ? '#00236F'
              : isOverdue
              ? '#E24B4A'
              : '#BBBBBB',
        }}
      />
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ color: '#111111' }}
        >
          {task.title}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{ color: isOverdue ? '#E24B4A' : '#BBBBBB' }}
        >
          {isOverdue ? 'Overdue' : 'Due ' + formatDate(task.due_date)}
        </p>
      </div>
      <StatusBadge status={task.status} isOverdue={isOverdue} />
    </div>
  )
}

function StatusBadge({
  status,
  isOverdue,
}: {
  status: string
  isOverdue: boolean
}) {
  if (isOverdue) {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
        style={{ color: '#E24B4A', borderColor: '#E24B4A' }}
      >
        Overdue
      </span>
    )
  }

  if (status === 'in_progress') {
    return (
      <span
        className="text-xs font-medium px-2.5 py-1 rounded-full text-white flex-shrink-0"
        style={{ backgroundColor: '#00236F' }}
      >
        Active
      </span>
    )
  }

  return (
    <span
      className="text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0"
      style={{
        color: '#BBBBBB',
        borderColor: '#EEEEEE',
        backgroundColor: '#F5F6FA',
      }}
    >
      Pending
    </span>
  )
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F6FA' }}>
      <div className="bg-white px-4 pt-4 pb-4 border-b" style={{ borderColor: '#EEEEEE' }}>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton width="80px" height="12px" />
            <Skeleton width="160px" height="20px" />
          </div>
          <Skeleton width="36px" height="36px" borderRadius="50%" />
        </div>
      </div>
      <div className="px-4 py-4 space-y-4">
        <Skeleton height="56px" borderRadius="12px" />
        <SkeletonStats count={2} />
        <SkeletonTable rows={3} />
        <Skeleton height="48px" borderRadius="12px" />
      </div>
    </div>
  )
}

function TasksSkeleton() {
  return <SkeletonTable rows={3} />
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

