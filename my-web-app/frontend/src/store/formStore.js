import { create } from 'zustand';

const MOCK_SUBMISSIONS = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', form_name: 'Contact Form', date: '2026-06-05T10:30:00Z', status: 'new', data: { subject: 'Interested in enterprise plan', message: 'Hello, I would like to know more about the enterprise plan and customization options.' } },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', form_name: 'Contact Form', date: '2026-06-04T14:22:00Z', status: 'read', data: { subject: 'Support request', message: 'I am having trouble publishing my website. Can you help?' } },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com', form_name: 'Newsletter Signup', date: '2026-06-03T09:15:00Z', status: 'replied', data: { subject: 'Welcome to the newsletter', message: 'Thank you for subscribing to our newsletter!' } },
  { id: 4, name: 'David Lee', email: 'david@example.com', form_name: 'Contact Form', date: '2026-06-02T16:45:00Z', status: 'new', data: { subject: 'Partnership inquiry', message: 'We would like to discuss a potential partnership.' } },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', form_name: 'Booking Form', date: '2026-06-01T11:00:00Z', status: 'read', data: { subject: 'Demo booking confirmation', message: 'Confirming my demo booking for next week.' } },
  { id: 6, name: 'Frank Wilson', email: 'frank@example.com', form_name: 'Feedback Form', date: '2026-05-31T08:20:00Z', status: 'replied', data: { subject: 'Product feedback', message: 'The new features are great! Would love to see more integrations.' } },
  { id: 7, name: 'Grace Kim', email: 'grace@example.com', form_name: 'Contact Form', date: '2026-05-30T13:10:00Z', status: 'new', data: { subject: 'Pricing question', message: 'Can you provide a detailed pricing breakdown?' } },
  { id: 8, name: 'Henry Brown', email: 'henry@example.com', form_name: 'Newsletter Signup', date: '2026-05-29T07:55:00Z', status: 'read', data: { subject: 'Newsletter feedback', message: 'Love the weekly updates!' } },
];

const MOCK_FORMS = [
  { id: 1, name: 'Contact Form', type: 'contact', status: 'published', submissions: 245, lastSubmission: '2 hours ago', description: 'Standard contact form for general inquiries', fields: [ { id: 'f1', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' }, { id: 'f2', type: 'email', label: 'Email Address', required: true, placeholder: 'john@example.com' }, { id: 'f3', type: 'phone', label: 'Phone Number', required: false, placeholder: '+1 (555) 000-0000' }, { id: 'f4', type: 'textarea', label: 'Message', required: true, placeholder: 'How can we help?' } ], settings: { successMessage: 'Thank you for your message!', redirectUrl: '', adminNotify: true, userNotify: false, captcha: false, spamProtection: true } },
  { id: 2, name: 'Newsletter Signup', type: 'newsletter', status: 'published', submissions: 520, lastSubmission: '1 day ago', description: 'Email subscription form for newsletter', fields: [ { id: 'f1', type: 'email', label: 'Email Address', required: true, placeholder: 'you@example.com' } ], settings: { successMessage: 'You have been subscribed!', redirectUrl: '', adminNotify: true, userNotify: true, captcha: false, spamProtection: true } },
  { id: 3, name: 'Booking Form', type: 'booking', status: 'published', submissions: 89, lastSubmission: '3 hours ago', description: 'Appointment booking form', fields: [ { id: 'f1', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' }, { id: 'f2', type: 'email', label: 'Email', required: true, placeholder: 'john@example.com' }, { id: 'f3', type: 'date', label: 'Preferred Date', required: true }, { id: 'f4', type: 'select', label: 'Service', required: true, options: ['Consultation', 'Support', 'Demo'] } ], settings: { successMessage: 'Booking request received!', redirectUrl: '', adminNotify: true, userNotify: true, captcha: true, spamProtection: true } },
  { id: 4, name: 'Survey Form', type: 'survey', status: 'draft', submissions: 0, lastSubmission: 'Never', description: 'Customer satisfaction survey', fields: [ { id: 'f1', type: 'text', label: 'Name', required: false, placeholder: 'Optional' }, { id: 'f2', type: 'radio', label: 'Rating', required: true, options: ['Excellent', 'Good', 'Fair', 'Poor'] }, { id: 'f3', type: 'textarea', label: 'Comments', required: false, placeholder: 'Share your thoughts' } ], settings: { successMessage: 'Thank you for your feedback!', redirectUrl: '', adminNotify: true, userNotify: false, captcha: false, spamProtection: false } },
  { id: 5, name: 'File Upload Request', type: 'custom', status: 'published', submissions: 34, lastSubmission: '5 hours ago', description: 'Form for document submissions', fields: [ { id: 'f1', type: 'text', label: 'Submission Title', required: true }, { id: 'f2', type: 'file', label: 'Upload File', required: true }, { id: 'f3', type: 'email', label: 'Email', required: true } ], settings: { successMessage: 'File submitted successfully!', redirectUrl: '', adminNotify: true, userNotify: true, captcha: true, spamProtection: true } },
];

const MOCK_MESSAGES = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', phone: '+1 555-0101', subject: 'Interested in enterprise plan', message: 'Hello, I would like to know more about the enterprise plan and customization options. Could you send me a detailed quote?', date: '2026-06-05', read: false, archived: false },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', phone: '', subject: 'Support request', message: 'I am having trouble publishing my website. The publish button is not responding. Can you help me resolve this issue?', date: '2026-06-04', read: true, archived: false },
  { id: 3, name: 'Carol Davis', email: 'carol@example.com', phone: '+1 555-0103', subject: 'Partnership inquiry', message: 'We would like to discuss a potential partnership. Our company specializes in digital marketing and we think there is a great synergy.', date: '2026-06-03', read: false, archived: false },
  { id: 4, name: 'David Lee', email: 'david@example.com', phone: '', subject: 'Bug report: form builder crash', message: 'When trying to add more than 10 fields to a form, the builder crashes. I am using Chrome on Windows.', date: '2026-06-02', read: true, archived: true },
  { id: 5, name: 'Eva Martinez', email: 'eva@example.com', phone: '+1 555-0105', subject: 'Feature request: webhook support', message: 'It would be great if forms could send data to webhooks on submission. This would help us integrate with our internal systems.', date: '2026-05-31', read: false, archived: false },
  { id: 6, name: 'Frank Wilson', email: 'frank@example.com', phone: '', subject: 'Billing question', message: 'I was charged twice for my subscription. Can you look into this and issue a refund?', date: '2026-05-30', read: true, archived: false },
];

const MOCK_ANALYTICS = {
  totalSubmissions: 888,
  avgDaily: 44,
  conversionRate: '3.8%',
  popularForm: 'Newsletter Signup',
  trend: [
    { date: 'May 01', submissions: 35, conversions: 1.2 },
    { date: 'May 05', submissions: 42, conversions: 1.8 },
    { date: 'May 10', submissions: 38, conversions: 1.5 },
    { date: 'May 15', submissions: 50, conversions: 2.1 },
    { date: 'May 20', submissions: 45, conversions: 1.9 },
    { date: 'May 25', submissions: 52, conversions: 2.3 },
    { date: 'May 30', submissions: 48, conversions: 2.0 },
    { date: 'Jun 01', submissions: 55, conversions: 2.4 },
    { date: 'Jun 05', submissions: 60, conversions: 2.6 },
  ],
};

export const useFormStore = create((set, get) => ({
  forms: MOCK_FORMS,
  submissions: MOCK_SUBMISSIONS,
  messages: MOCK_MESSAGES,
  analytics: MOCK_ANALYTICS,
  selectedFormId: null,
  selectedSubmissionId: null,
  selectedMessageId: null,
  showBuilder: false,
  showPreview: false,
  previewDevice: 'desktop',
  showSettings: false,
  showEmailComposer: false,
  replyToMessageId: null,
  activeView: 'overview',
  searchQuery: '',
  filterType: 'all',
  filterStatus: 'all',
  filterDateRange: '7days',
  loadingForms: false,
  loadingSubmissions: false,
  error: null,

  setActiveView: (view) => set({ activeView: view }),
  setSelectedFormId: (id) => set({ selectedFormId: id }),
  setSelectedSubmissionId: (id) => set({ selectedSubmissionId: id }),
  setSelectedMessageId: (id) => set({ selectedMessageId: id, replyToMessageId: id }),
  setShowBuilder: (show) => set({ showBuilder: show }),
  setShowPreview: (show, device) => set({ showPreview: show, previewDevice: device || get().previewDevice }),
  setPreviewDevice: (device) => set({ previewDevice: device }),
  setShowSettings: (show) => set({ showSettings: show }),
  setShowEmailComposer: (show, messageId) => set({ showEmailComposer: show, replyToMessageId: messageId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilterType: (type) => set({ filterType: type }),
  setFilterStatus: (status) => set({ filterStatus: status }),
  setFilterDateRange: (range) => set({ filterDateRange: range }),

  addForm: (form) => set((state) => ({ forms: [...state.forms, { ...form, id: Date.now(), submissions: 0, lastSubmission: 'Never' }], showBuilder: false })),
  updateForm: (id, updates) => set((state) => ({ forms: state.forms.map((f) => (f.id === id ? { ...f, ...updates } : f)) })),
  deleteForm: (id) => set((state) => ({ forms: state.forms.filter((f) => f.id !== id) })),

  addSubmission: (submission) => set((state) => ({ submissions: [submission, ...state.submissions] })),
  updateSubmissionStatus: (id, status) => set((state) => ({ submissions: state.submissions.map((s) => (s.id === id ? { ...s, status } : s)) })),
  deleteSubmission: (id) => set((state) => ({ submissions: state.submissions.filter((s) => s.id !== id) })),

  markMessageRead: (id) => set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, read: true } : m)) })),
  archiveMessage: (id) => set((state) => ({ messages: state.messages.map((m) => (m.id === id ? { ...m, archived: !m.archived } : m)) })),
  deleteMessage: (id) => set((state) => ({ messages: state.messages.filter((m) => m.id !== id) })),

  getFilteredSubmissions: () => {
    const { submissions, searchQuery, filterStatus, filterDateRange } = get();
    return submissions.filter((s) => {
      const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()) || s.form_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      let matchesDate = true;
      const now = new Date();
      const subDate = new Date(s.date);
      const days = filterDateRange === '7days' ? 7 : filterDateRange === '30days' ? 30 : 90;
      matchesDate = (now - subDate) <= days * 24 * 60 * 60 * 1000;
      return matchesSearch && matchesStatus && matchesDate;
    });
  },

  getFilteredMessages: () => {
    const { messages, searchQuery } = get();
    return messages.filter((m) => !searchQuery || m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.email.toLowerCase().includes(searchQuery.toLowerCase()) || m.subject.toLowerCase().includes(searchQuery.toLowerCase()));
  },
}));
