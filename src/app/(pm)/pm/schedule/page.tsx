'use client'

import { useState } from 'react'
import { usePMProjects } from '@/hooks/usePMProjects'
import { usePMTasks } from '@/hooks/usePMTasks'
import { usePMEngineers } from '@/hooks/usePMEngineers'
import CalendarHeader from '@/components/pm/schedule/CalendarHeader'
import CalendarGrid from '@/components/pm/schedule/CalendarGrid'
import MobileCalendar from '@/components/pm/schedule/MobileCalendar'
import TaskForm from '@/components/pm/schedule/TaskForm'
import DayTaskList from '@/components/pm/schedule/DayTaskList'

export default function SchedulePage() {
  const today = new Date()
  const [viewMonth, setViewMonth] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [selectedDate, setSelectedDate] = useState(today)

  const { projects } = usePMProjects()
  const { tasks, loading: tasksLoading, createTask, deleteTask } = usePMTasks(projects)
  const { engineers } = usePMEngineers(projects)

  function goToPrevMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  }

  function goToNextMonth() {
    setViewMonth((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  }

  function goToToday() {
    const now = new Date()
    setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1))
    setSelectedDate(now)
  }

  return (
    <div style={{ backgroundColor: '#F5F6FA', minHeight: '100vh', padding: '32px 20px' }}>
      <div
        className="px-4 py-5 md:px-8 md:py-8"
        style={{ maxWidth: '1200px', margin: '0 auto' }}
      >
      <h1 className="font-semibold mb-1" style={{ color: '#111111', fontSize: '24px' }}>
        Schedule
      </h1>
      <p className="text-sm mb-6" style={{ color: '#666666' }}>
        Create and assign tasks to your site engineers
      </p>

      {/* Mobile: week strip + task list stacked */}
      <div className="md:hidden flex flex-col gap-4">
        <MobileCalendar selectedDate={selectedDate} tasks={tasks} onSelectDay={setSelectedDate} />
        <div className="bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
          <TaskForm selectedDate={selectedDate} projects={projects} engineers={engineers} onCreateTask={createTask} />
        </div>
      </div>

      {/* Desktop: two-column layout */}
      <div className="hidden md:flex flex-row gap-5 items-start">
        <div className="w-full flex-1 bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
          <CalendarHeader viewMonth={viewMonth} onPrev={goToPrevMonth} onNext={goToNextMonth} onToday={goToToday} />
          <CalendarGrid viewMonth={viewMonth} selectedDate={selectedDate} tasks={tasks} onSelectDay={setSelectedDate} loading={tasksLoading} />
        </div>
        <div className="w-full md:w-[380px] md:shrink-0 bg-white rounded-xl p-5" style={{ border: '0.5px solid #EEEEEE' }}>
          <TaskForm selectedDate={selectedDate} projects={projects} engineers={engineers} onCreateTask={createTask} />
          <DayTaskList selectedDate={selectedDate} tasks={tasks} onDelete={deleteTask} />
        </div>
      </div>
      </div>
    </div>
  )
}
