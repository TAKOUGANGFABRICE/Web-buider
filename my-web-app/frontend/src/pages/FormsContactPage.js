import React, { useState } from 'react';
import { FiPlay, FiX } from 'react-icons/fi';
import { useFormStore } from '../store/formStore';
import StatCard, { FORM_STATS } from '../components/forms/StatCard';
import FormsTable from '../components/forms/FormsTable';
import FormBuilder from '../components/forms/FormBuilder';
import FormPreview from '../components/forms/FormPreview';
import FormSettings from '../components/forms/FormSettings';
import SearchAndFilters from '../components/forms/SearchAndFilters';
import SubmissionsTable from '../components/forms/SubmissionsTable';
import ContactMessages from '../components/forms/ContactMessages';
import MessageDetailPanel from '../components/forms/MessageDetailPanel';
import AnalyticsSection from '../components/forms/AnalyticsSection';
import AutomationSection from '../components/forms/AutomationSection';
import EmptyState from '../components/forms/EmptyState';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'forms', label: 'Forms', icon: '📋' },
  { id: 'submissions', label: 'Submissions', icon: '📨' },
  { id: 'messages', label: 'Contact Messages', icon: '💬' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
  { id: 'automation', label: 'Automation', icon: '⚡' },
];

export default function FormsContactPage() {
  const {
    activeView, setActiveView,
    forms, selectedFormId, setSelectedFormId, showBuilder, setShowBuilder,
    showPreview, previewDevice, setShowPreview,
    showSettings, setShowSettings,
    showEmailComposer, replyToMessageId,
    selectedMessageId,
    submissions, selectedSubmissionId, setSelectedSubmissionId,
    messages, setSelectedMessageId, setShowEmailComposer,
    searchQuery, setSearchQuery,
    filterType, setFilterType,
    filterStatus, setFilterStatus,
    filterDateRange, setFilterDateRange,
    addForm, updateForm, deleteForm,
    addSubmission, updateSubmissionStatus, deleteSubmission,
    markMessageRead, archiveMessage, deleteMessage,
    getFilteredSubmissions, getFilteredMessages,
  } = useFormStore();

  const [builderForm, setBuilderForm] = useState({ name: '', fields: [] });
  const [editingForm, setEditingForm] = useState(null);

  const filteredSubmissions = getFilteredSubmissions();
  const filteredMessages = getFilteredMessages();

  const handleCreateForm = () => {
    setEditingForm(null);
    setBuilderForm({ name: '', fields: [] });
    setShowBuilder(true);
  };

  const handleEditForm = (form) => {
    setEditingForm(form);
    setBuilderForm(form);
    setShowBuilder(true);
  };

  const handleSaveBuilder = () => {
    if (!builderForm.name.trim()) return;
    if (editingForm) {
      updateForm(editingForm.id, builderForm);
    } else {
      addForm(builderForm);
    }
    setBuilderForm({ name: '', fields: [] });
    setEditingForm(null);
  };

  const handleSaveSettings = (form) => {
    updateForm(form.id, form);
    setShowSettings(false);
  };

  const handleViewSubmissions = (form) => {
    setActiveView('submissions');
    setSelectedFormId(form.id);
  };

  const handleDuplicate = (form) => {
    addForm({ ...form, id: undefined, name: `${form.name} (Copy)`, submissions: 0, lastSubmission: 'Never' });
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this form? This action cannot be undone.')) {
      deleteForm(id);
    }
  };

  const handleSelectMessage = (id) => {
    setSelectedMessageId(id);
    const msg = messages.find((m) => m.id === id);
    if (msg && !msg.read) markMessageRead(id);
  };

  const handleExport = (type) => {
    alert(`Exporting submissions as ${type.toUpperCase()}...`);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {FORM_STATS.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-card">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {submissions.slice(0, 5).map((sub) => (
            <div key={sub.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-800">{sub.name} submitted {sub.form_name}</p>
                <p className="text-xs text-slate-500">{sub.email}</p>
              </div>
              <span className="text-xs text-slate-400">{new Date(sub.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderForms = () => (
    <div className="space-y-4">
      {showSettings && editingForm ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { setShowSettings(false); setEditingForm(null); }} className="text-sm text-primary-600 hover:text-primary-700 font-medium">← Back to Forms</button>
          </div>
          <FormSettings form={editingForm} setFormSettings={setEditingForm} onSave={handleSaveSettings} />
        </div>
      ) : (
        <>
          <FormsTable
            forms={forms}
            onEdit={handleEditForm}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            onViewSubmissions={handleViewSubmissions}
          />
        </>
      )}
    </div>
  );

  const renderBuilder = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">{editingForm ? 'Edit Form' : 'Create New Form'}</h3>
          <p className="text-sm text-slate-500">Build your form by adding and configuring fields.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview(true)} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <FiPlay size={14} /> Preview
          </button>
          <button onClick={() => { setShowBuilder(false); setEditingForm(null); setBuilderForm({ name: '', fields: [] }); }} className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50">
            <FiX size={14} /> Cancel
          </button>
          <button
            onClick={handleSaveBuilder}
            disabled={!builderForm.name.trim()}
            className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingForm ? 'Update Form' : 'Create Form'}
          </button>
        </div>
      </div>

      <FormBuilder builderForm={builderForm} setBuilderForm={setBuilderForm} />
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-4">
      <SubmissionsTable
        submissions={filteredSubmissions}
        onSelect={setSelectedSubmissionId}
        selectedId={selectedSubmissionId}
        onStatusChange={updateSubmissionStatus}
        onDelete={deleteSubmission}
      />
      {selectedSubmissionId && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-card mt-4">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Submission Detail</h3>
          {(() => {
            const sub = submissions.find((s) => s.id === selectedSubmissionId);
            if (!sub) return <p className="text-sm text-slate-500">Submission not found.</p>;
            return (
              <div className="space-y-2 text-sm">
                <div><span className="text-slate-500">Name:</span> <span className="font-medium text-slate-900 ml-1">{sub.name}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900 ml-1">{sub.email}</span></div>
                <div><span className="text-slate-500">Form:</span> <span className="font-medium text-slate-900 ml-1">{sub.form_name}</span></div>
                <div><span className="text-slate-500">Date:</span> <span className="font-medium text-slate-900 ml-1">{new Date(sub.date).toLocaleString()}</span></div>
                <div className="pt-2 border-t border-slate-100"><span className="text-slate-500">Message:</span><p className="mt-1 text-slate-700">{sub.message || 'No message provided.'}</p></div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );

  const renderMessages = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ContactMessages
        messages={filteredMessages}
        onSelect={handleSelectMessage}
        selectedId={selectedMessageId}
        onArchive={archiveMessage}
        onDelete={deleteMessage}
      />
      <MessageDetailPanel
        message={messages.find((m) => m.id === selectedMessageId) || null}
        onClose={() => setSelectedMessageId(null)}
        onReply={() => setShowEmailComposer(true)}
        onArchive={archiveMessage}
        onDelete={deleteMessage}
      />
    </div>
  );

  const activeNav = NAV_ITEMS.find((n) => n.id === activeView) || NAV_ITEMS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Forms & Contact</h1>
          <p className="text-sm text-slate-500 mt-0.5">Create forms, manage submissions, and communicate with your website visitors.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleCreateForm} className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
            + Create New Form
          </button>
          <button onClick={() => handleDuplicate({ name: 'Import', fields: [] })} className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
            Import Form
          </button>
          <div className="relative group">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
              Export Submissions ▾
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
              <button onClick={() => handleExport('pdf')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Export as PDF</button>
              <button onClick={() => handleExport('excel')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Export as Excel</button>
              <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">Export as CSV</button>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveView(item.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeView === item.id ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <SearchAndFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        filterType={filterType} setFilterType={setFilterType}
        filterStatus={filterStatus} setFilterStatus={setFilterStatus}
        filterDateRange={filterDateRange} setFilterDateRange={setFilterDateRange}
      />

      {showBuilder ? renderBuilder() : (
        <div className="animate-fadeIn">
          {activeView === 'overview' && renderOverview()}
          {activeView === 'forms' && renderForms()}
          {activeView === 'submissions' && renderSubmissions()}
          {activeView === 'messages' && renderMessages()}
          {activeView === 'analytics' && <AnalyticsSection analytics={useFormStore.getState().analytics} />}
          {activeView === 'automation' && <AutomationSection />}
        </div>
      )}

      {showPreview && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4" onClick={() => setShowPreview(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-base font-semibold text-slate-900">Form Preview</h3>
              <div className="flex items-center gap-2">
                <DeviceBtn active={previewDevice === 'desktop'} label="Desktop" onClick={() => setShowPreview(true, 'desktop')} />
                <DeviceBtn active={previewDevice === 'tablet'} label="Tablet" onClick={() => setShowPreview(true, 'tablet')} />
                <DeviceBtn active={previewDevice === 'mobile'} label="Mobile" onClick={() => setShowPreview(true, 'mobile')} />
                <button onClick={() => setShowPreview(false)} className="ml-2 p-1.5 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100">
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-64px)]">
              <FormPreview form={{ ...builderForm, id: editingForm?.id, description: editingForm?.description }} device={previewDevice} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DeviceBtn({ active, label, onClick }) {
  return (
    <button
      onClick={() => onClick()}
      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${active ? 'bg-primary-50 text-primary-700' : 'text-slate-600 hover:bg-slate-50'}`}
    >
      {label}
    </button>
  );
}
