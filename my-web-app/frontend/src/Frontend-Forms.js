import React, { useState } from "react";
import "./Frontend-Forms.css";

import {
  FaWpforms,
  FaPaperPlane,
  FaCommentDots,
  FaPercent,
  FaFolderOpen,
  FaEdit,
  FaEye,
  FaCopy,
  FaTrashAlt,
} from "react-icons/fa";
import { FiPlus, FiUpload, FiDownload } from "react-icons/fi";

const MOCK_STATS = [
  {
    id: 1,
    title: "Total Forms",
    value: "12",
    icon: <FaWpforms />,
    trend: "+12%",
    positive: true,
  },
  {
    id: 2,
    title: "Total Submissions",
    value: "3,856",
    icon: <FaPaperPlane />,
    trend: "+18%",
    positive: true,
  },
  {
    id: 3,
    title: "Unread Messages",
    value: "24",
    icon: <FaCommentDots />,
    trend: "3 new today",
    positive: false,
  },
  {
    id: 4,
    title: "Conversion Rate",
    value: "4.8%",
    icon: <FaPercent />,
    trend: "+1.2%",
    positive: true,
  },
];

const MOCK_FORMS = [
  {
    id: 1,
    name: "Contact Form",
    type: "Contact",
    status: "Published",
    submissions: 245,
    last: "2 hours ago",
  },
  {
    id: 2,
    name: "Newsletter Form",
    type: "Newsletter",
    status: "Published",
    submissions: 520,
    last: "1 day ago",
  },
  {
    id: 3,
    name: "Booking Form",
    type: "Booking",
    status: "Draft",
    submissions: 0,
    last: "Never",
  },
  {
    id: 4,
    name: "Support Request",
    type: "Support",
    status: "Published",
    submissions: 89,
    last: "5 hours ago",
  },
];

const MOCK_FIELDS = [
  { id: "text", label: "Text Input", group: "Basic" },
  { id: "email", label: "Email Input", group: "Basic" },
  { id: "phone", label: "Phone Number", group: "Basic" },
  { id: "textarea", label: "Text Area", group: "Basic" },

  { id: "select", label: "Dropdown", group: "Selection" },
  { id: "checkbox", label: "Checkbox", group: "Selection" },
  { id: "radio", label: "Radio Button", group: "Selection" },

  { id: "date", label: "Date Picker", group: "Advanced" },
  { id: "file", label: "File Upload", group: "Advanced" },
  { id: "rating", label: "Rating Field", group: "Advanced" },
  { id: "address", label: "Address Field", group: "Advanced" },

  { id: "submit", label: "Submit Button", group: "Buttons" },
  { id: "reset", label: "Reset Button", group: "Buttons" },
];

export default function FrontendForms() {
  const [view, setView] = useState("overview");
  const [selectedForm, setSelectedForm] = useState(null);
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fieldMeta, setFieldMeta] = useState({});
  const [formFields, setFormFields] = useState([]);

  const toggleField = (id) => {
    setFormFields((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const filteredForms = MOCK_FORMS.filter((f) => {
    const matchesSearch =
      !search ||
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="ff-page">
      <header className="ff-page-header">
        <div className="ff-header-left">
          <h1 className="ff-page-title">Forms & Contact</h1>
          <p className="ff-page-subtitle">
            Create forms, manage submissions, and communicate with your website visitors.
          </p>
        </div>
        <div className="ff-header-actions">
          <button className="ff-btn ff-btn-primary" onClick={() => setShowFormSheet(true)}>
            <FiPlus /> Create New Form
          </button>
          <button className="ff-btn ff-btn-secondary" onClick={() => setShowImport(true)}>
            <FiUpload /> Import Form
          </button>
          <div className="ff-dropdown">
            <button className="ff-btn ff-btn-secondary ff-dropdown-trigger">
              <FiDownload /> Export Submissions
            </button>
          </div>
        </div>
      </header>

      <nav className="ff-nav">
        <button
          onClick={() => setView("overview")}
          className={`ff-nav-item ${view === "overview" ? "ff-nav-item--active" : ""}`}
        >
          Overview
        </button>
        <button
          onClick={() => setView("forms")}
          className={`ff-nav-item ${view === "forms" ? "ff-nav-item--active" : ""}`}
        >
          Forms
        </button>
        <button
          onClick={() => setView("submissions")}
          className={`ff-nav-item ${view === "submissions" ? "ff-nav-item--active" : ""}`}
        >
          Submissions
        </button>
        <button
          onClick={() => setView("messages")}
          className={`ff-nav-item ${view === "messages" ? "ff-nav-item--active" : ""}`}
        >
          Contact Messages
        </button>
        <button
          onClick={() => setView("builder")}
          className={`ff-nav-item ${view === "builder" ? "ff-nav-item--active" : ""}`}
        >
          Form Builder
        </button>
      </nav>

      {view === "overview" && (
        <section className="ff-section">
          <div className="ff-stats-grid">
            {MOCK_STATS.map((stat) => (
              <div key={stat.id} className="ff-stat-card">
                <div className="ff-stat-icon">{stat.icon}</div>
                <div className="ff-stat-body">
                  <p className="ff-stat-title">{stat.title}</p>
                  <p className="ff-stat-value">{stat.value}</p>
                  <p className={`ff-stat-trend ${stat.positive ? "ff-stat-trend--up" : "ff-stat-trend--down"}`}>
                    {stat.trend}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {view === "forms" && (
        <section className="ff-section">
          <div className="ff-toolbar">
            <div className="ff-search">
              <input
                type="text"
                placeholder="Search forms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ff-input"
              />
            </div>
            <select
              className="ff-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>

          <div className="ff-card">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Form Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Total Submissions</th>
                  <th>Last Submission</th>
                  <th className="ff-table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredForms.length === 0 && (
                  <tr>
                    <td colSpan={6} className="ff-empty">
                      No forms found.
                    </td>
                  </tr>
                )}
                {filteredForms.map((form) => (
                  <tr key={form.id}>
                    <td className="ff-table-name">{form.name}</td>
                    <td>{form.type}</td>
                    <td>
                      <span className={`ff-badge ${form.status === "Published" ? "ff-badge--success" : "ff-badge--muted"}`}>
                        {form.status}
                      </span>
                    </td>
                    <td>{form.submissions.toLocaleString()}</td>
                    <td>{form.last}</td>
                    <td className="ff-table-actions">
                      <button
                        className="ff-icon-btn"
                        title="Edit"
                        onClick={() => {
                          setSelectedForm(form);
                          setView("builder");
                        }}
                      >
                        <FaEdit />
                      </button>
                      <button className="ff-icon-btn" title="Preview" onClick={() => setView("builder")}>
                        <FaEye />
                      </button>
                      <button
                        className="ff-icon-btn"
                        title="Duplicate"
                        onClick={() => {
                          setSelectedForm({
                            ...form,
                            id: Date.now(),
                            name: `${form.name} (Copy)`,
                          });
                          setView("builder");
                        }}
                      >
                        <FaCopy />
                      </button>
                      <button
                        className="ff-icon-btn ff-icon-btn--danger"
                        title="Delete"
                        onClick={() => {
                          if (window.confirm("Delete this form?")) {
                            const idx = MOCK_FORMS.findIndex((x) => x.id === form.id);
                            if (idx > -1) MOCK_FORMS.splice(idx, 1);
                            if (selectedForm?.id === form.id) setSelectedForm(null);
                          }
                        }}
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "submissions" && (
        <section className="ff-section">
          <div className="ff-card">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Form</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="ff-table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>No submissions yet.</td>
                  <td colSpan={5} className="ff-empty" />
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "messages" && (
        <section className="ff-section">
          <div className="ff-card">
            <table className="ff-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subject</th>
                  <th>Preview</th>
                  <th>Date</th>
                  <th className="ff-table-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="ff-empty">
                    No messages yet.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "builder" && (
        <section className="ff-section">
          <div className="ff-builder">
            <div className="ff-builder-sidebar">
              <p className="ff-builder-heading">Field Types</p>
              <div className="ff-field-groups">
                {["Basic", "Selection", "Advanced", "Buttons"].map((group) => (
                  <div key={group} className="ff-field-group">
                    <p className="ff-field-group-title">{group}</p>
                    <div className="ff-field-grid">
                      {MOCK_FIELDS.filter((f) => f.group === group).map((field) => (
                        <button
                          key={field.id}
                          className={`ff-field-chip ${formFields.includes(field.id) ? "ff-field-chip--selected" : ""}`}
                          onClick={() => toggleField(field.id)}
                          type="button"
                        >
                          {field.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ff-builder-main">
              <div className="ff-builder-canvas">
                <p className="ff-builder-canvas-title">Selected Fields</p>
                {formFields.length === 0 ? (
                  <div className="ff-builder-placeholder">
                    Select fields from the left to build your form.
                  </div>
                ) : (
                  <div className="ff-field-list">
                    {formFields.map((id) => {
                      const def = MOCK_FIELDS.find((x) => x.id === id);
                      return (
                        <div key={id} className="ff-field-item">
                          <label className="ff-field-label">{def?.label}</label>
                          <input
                            className="ff-input ff-input--small"
                            placeholder={`${def?.label} placeholder`}
                            value={fieldMeta[id] || ""}
                            onChange={(e) =>
                              setFieldMeta((prev) => ({ ...prev, [id]: e.target.value }))
                            }
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {showFormSheet && (
        <div className="ff-overlay" onClick={() => setShowFormSheet(false)}>
          <div className="ff-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ff-sheet-head">
              <h3 className="ff-sheet-title">Create New Form</h3>
              <button className="ff-icon-btn" onClick={() => setShowFormSheet(false)}>
                ✕
              </button>
            </div>
            <div className="ff-sheet-body">
              <div className="ff-field">
                <label className="ff-label">Form Name</label>
                <input className="ff-input" autoFocus />
              </div>
              <div className="ff-field">
                <label className="ff-label">Description</label>
                <textarea className="ff-input" rows={3} />
              </div>
              <div className="ff-field">
                <label className="ff-checkbox">
                  <input type="checkbox" />
                  Enable email notifications
                </label>
              </div>
            </div>
            <div className="ff-sheet-actions">
              <button className="ff-btn ff-btn-secondary" onClick={() => setShowFormSheet(false)}>
                Cancel
              </button>
              <button className="ff-btn ff-btn-primary" onClick={() => setShowFormSheet(false)}>
                Create Form
              </button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="ff-overlay" onClick={() => setShowImport(false)}>
          <div className="ff-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="ff-sheet-head">
              <h3 className="ff-sheet-title">Import Form</h3>
              <button className="ff-icon-btn" onClick={() => setShowImport(false)}>
                ✕
              </button>
            </div>
            <div className="ff-sheet-body">
              <div className="ff-dropzone">Drop form JSON here or click to upload</div>
            </div>
            <div className="ff-sheet-actions">
              <button className="ff-btn ff-btn-secondary" onClick={() => setShowImport(false)}>
                Cancel
              </button>
              <button className="ff-btn ff-btn-primary" onClick={() => setShowImport(false)}>
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
