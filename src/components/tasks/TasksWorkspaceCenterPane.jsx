import React, { useState, useEffect, useMemo } from 'react';
import { 
  ListChecks, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  Calendar, 
  Filter, 
  Search, 
  ArrowLeft, 
  RefreshCw,
  Trash2,
  Check,
  Shield,
  FileText
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { taskApi } from '../../services/api/taskApi';

export function TasksWorkspaceCenterPane({
  currentUser,
  onBackToPolicy,
  onOpenPolicy,
  onOpenAddPolicyModal
}) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'in_progress' | 'completed'
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignableUsers, setAssignableUsers] = useState([]);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assigned_to: 'Sarah Jenkins',
    priority: 'high',
    due_date: 'Tomorrow, 5:00 PM',
    category: 'Policy Drafting',
    linked_policy_id: ''
  });

  const isBankOwner = currentUser?.roleType === 'manager' || currentUser?.roleType === 'admin';

  // Load assignable bank users for filters and assignments
  useEffect(() => {
    taskApi.getAssignableUsers()
      .then(users => {
        if (Array.isArray(users) && users.length > 0) {
          setAssignableUsers(users);
        }
      })
      .catch(() => {});
  }, []);

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getTasks();
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  // Listen for real-time task creation from chat/copilot
  useEffect(() => {
    const handleTaskCreated = (e) => {
      if (e.detail) {
        setTasks(prev => {
          if (prev.some(t => t.id === e.detail.id)) return prev;
          return [e.detail, ...prev];
        });
      }
    };
    window.addEventListener('liblist:task_created', handleTaskCreated);
    return () => window.removeEventListener('liblist:task_created', handleTaskCreated);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;

    setIsSubmitting(true);
    try {
      await apiService.createTask({
        ...newTask,
        assigned_by: currentUser?.name || 'Marcus Vance (Bank Administrator)',
        status: 'pending'
      });
      setIsAssignModalOpen(false);
      setNewTask({
        title: '',
        description: '',
        assigned_to: 'Sarah Jenkins',
        priority: 'high',
        due_date: 'Tomorrow, 5:00 PM',
        category: 'Policy Drafting',
        linked_policy_id: ''
      });
      await loadTasks();
    } catch (err) {
      alert('Failed to assign task: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      await apiService.updateTask(taskId, { status: newStatus });
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    } catch (err) {
      alert('Failed to update task: ' + err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await apiService.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      alert('Failed to delete task: ' + err.message);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const assigneeStr = `${t.assigned_to_name || ''} ${t.assigned_to || ''}`.toLowerCase();
      const matchesAssignee = filterAssignee === 'all' || 
        assigneeStr.includes(filterAssignee.toLowerCase());
      const matchesSearch = !searchQuery || 
        (t.title && t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.task_code && t.task_code.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesStatus && matchesAssignee && matchesSearch;
    });
  }, [tasks, filterStatus, filterAssignee, searchQuery]);

  const activeCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8fafc] overflow-hidden select-text">
      
      {/* Top Header Bar */}
      <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          {onBackToPolicy && (
            <button
              onClick={onBackToPolicy}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
              title="Return to Active Policy Workspace"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Policy</span>
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-[#0057B8]" />
              <h1 className="text-base font-bold text-slate-900 tracking-tight">
                Institutional Workflow & Assigned Tasks
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#0057B8] border border-blue-200">
                {activeCount} Active
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 mt-0.5">
              Task delegation, policy drafting assignments, and APRA compliance actions tracked in database
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadTasks}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            title="Refresh Tasks"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-xs transition cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Assign New Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-[#0057B8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Tasks ({tasks.length})
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'in_progress'
                ? 'bg-[#0057B8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            In Progress ({tasks.filter(t => t.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'pending'
                ? 'bg-[#0057B8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Pending ({tasks.filter(t => t.status === 'pending').length})
          </button>
          <button
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-[#0057B8] text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Completed ({tasks.filter(t => t.status === 'completed').length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:border-[#0057B8]"
          >
            <option value="all">All Assignees</option>
            {assignableUsers.length > 0 ? (
              assignableUsers.map(u => (
                <option key={u.id} value={u.name}>{u.name} ({u.role || u.role_type || 'Staff'})</option>
              ))
            ) : (
              <>
                <option value="Sarah Jenkins">Sarah Jenkins (Employee)</option>
                <option value="Marcus Vance">Marcus Vance (Approver)</option>
                <option value="David Miller">David Miller (Underwriter)</option>
              </>
            )}
          </select>

          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#0057B8]"
            />
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <CheckCircle2 className="w-10 h-10 text-[#0057B8] mx-auto mb-2" />
            <h3 className="font-bold text-slate-800 text-sm">No Tasks Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              There are no tasks matching your filters. Click "Assign New Task" to delegate actions.
            </p>
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isCompleted = t.status === 'completed';
            const isInProgress = t.status === 'in_progress';

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border bg-white shadow-2xs transition-all hover:border-slate-300 ${
                  isCompleted ? 'border-slate-200 opacity-75' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => handleUpdateStatus(t.id, isCompleted ? 'in_progress' : 'completed')}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                        isCompleted 
                          ? 'bg-[#0057B8] border-[#0057B8] text-white' 
                          : 'border-slate-300 hover:border-[#0057B8] text-transparent hover:text-slate-400'
                      }`}
                      title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {t.task_code ? t.task_code : `TASK-#${t.id}`}
                        </span>
                        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded ${
                          t.priority === 'high' 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-blue-50 text-[#0057B8] border border-blue-200'
                        }`}>
                          {t.priority ? t.priority.toUpperCase() : 'MEDIUM'} PRIORITY
                        </span>
                        <span className={`text-[10.5px] font-semibold px-2 py-0.5 rounded ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInProgress
                            ? 'bg-blue-50 text-[#0057B8] border border-blue-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Pending'}
                        </span>
                        <span className="text-[10.5px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {t.category || 'Workflow'}
                        </span>
                        {(t.is_draft || String(t.linked_policy_id).toLowerCase().includes('draft') || String(t.category).toLowerCase().includes('draft')) && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                            Assigned Draft
                          </span>
                        )}
                      </div>

                      <h4 className={`text-sm font-bold text-slate-900 ${isCompleted ? 'line-through text-slate-500' : ''}`}>
                        {t.title}
                      </h4>
                      {t.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          {t.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 mt-3 pt-2.5 border-t border-slate-100">
                        <span className="flex items-center gap-1.5 font-medium text-slate-700">
                          <User className="w-3.5 h-3.5 text-[#0057B8]" />
                          <span>Assigned to: <strong>{t.assigned_to_name || t.assigned_to || 'Unassigned'}</strong></span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Due: <strong>{t.due_date || 'Ongoing'}</strong></span>
                        </span>
                        <span className="text-slate-400">
                          Delegated by <strong>{t.created_by_name || t.assigned_by || 'Marcus Vance'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {!isCompleted && !isInProgress && (
                      <button
                        onClick={() => handleUpdateStatus(t.id, 'in_progress')}
                        className="px-2.5 py-1 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#0057B8] rounded-lg transition cursor-pointer"
                      >
                        Start Task
                      </button>
                    )}

                    {(() => {
                      const linkedDocId = t.linked_policy_id || t.library_id;
                      if (!linkedDocId || !onOpenPolicy) return null;

                      const isDraftTask = Boolean(
                        t.is_draft || 
                        String(linkedDocId).toLowerCase().includes('draft') ||
                        String(t.title).toLowerCase().includes('draft') ||
                        String(t.category).toLowerCase().includes('draft') ||
                        String(t.section_id).toLowerCase().includes('draft')
                      );

                      return (
                        <button
                          type="button"
                          onClick={() => onOpenPolicy(linkedDocId)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                            isDraftTask
                              ? 'bg-[#0057B8] hover:bg-[#004EA6] text-white shadow-xs active:scale-95'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                          title={isDraftTask ? 'Open Assigned Draft in Change Management' : 'Open Policy'}
                        >
                          {isDraftTask ? (
                            <>
                              <FileText className="w-3.5 h-3.5 text-white" />
                              <span>Work on Draft →</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5 text-slate-500" />
                              <span>Open Policy</span>
                            </>
                          )}
                        </button>
                      );
                    })()}

                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Assign New Task */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-50 text-[#0057B8] border border-blue-200">
                  <ListChecks className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Assign Compliance / Policy Task</h3>
                  <p className="text-xs text-slate-500">Record in PostgreSQL database with institutional audit trail</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                  Task Directive Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Complete SOP Clauses for Commercial Equipment Finance"
                  value={newTask.title}
                  onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                  Detailed Instructions & Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide explicit instructions, regulatory benchmarks, and required sections..."
                  value={newTask.description}
                  onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                    Assign To Personnel
                  </label>
                  <select
                    value={newTask.assigned_to}
                    onChange={(e) => setNewTask(prev => ({ ...prev, assigned_to: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs bg-white font-medium"
                  >
                    <option value="Sarah Jenkins">Sarah Jenkins (Bank Employee)</option>
                    <option value="Marcus Vance">Marcus Vance (Bank Administrator)</option>
                    <option value="Compliance Squad">Compliance Squad (All Personnel)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                    Priority Benchmark
                  </label>
                  <select
                    value={newTask.priority}
                    onChange={(e) => setNewTask(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs bg-white font-medium"
                  >
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                    Completion Due Date
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tomorrow, 5:00 PM"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask(prev => ({ ...prev, due_date: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 uppercase tracking-wider text-[10.5px]">
                    Category
                  </label>
                  <select
                    value={newTask.category}
                    onChange={(e) => setNewTask(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:outline-none focus:border-[#0057B8] text-xs bg-white font-medium"
                  >
                    <option value="Policy Drafting">Policy Drafting</option>
                    <option value="APRA CPS 234 Audit">APRA CPS 234 Audit</option>
                    <option value="Maker-Checker Review">Maker-Checker Review</option>
                    <option value="Staff Accreditation">Staff Accreditation</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#0057B8] hover:bg-[#004EA6] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Recording in DB...' : 'Assign & Track Task'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default TasksWorkspaceCenterPane;

