import React, { useState } from 'react';
import { FiTrash2 } from 'react-icons/fi';

export default function FormBuilder({ builderForm, setBuilderForm }) {
  const [newField, setNewField] = useState(null);

  const basicFields = [
    { type: 'text', label: 'Text Input', icon: '📝' },
    { type: 'email', label: 'Email Input', icon: '📧' },
    { type: 'phone', label: 'Phone Number', icon: '📞' },
    { type: 'textarea', label: 'Text Area', icon: '📄' },
  ];

  const selectionFields = [
    { type: 'select', label: 'Dropdown', icon: '🔽' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { type: 'radio', label: 'Radio Button', icon: '🔘' },
  ];

  const advancedFields = [
    { type: 'date', label: 'Date Picker', icon: '📅' },
    { type: 'file', label: 'File Upload', icon: '📎' },
    { type: 'rating', label: 'Rating Field', icon: '⭐' },
    { type: 'address', label: 'Address Field', icon: '📍' },
  ];

  const buttonFields = [
    { type: 'submit', label: 'Submit Button', icon: '✅' },
    { type: 'reset', label: 'Reset Button', icon: '🔄' },
  ];

  const allFieldGroups = [
    { title: 'Basic Fields', fields: basicFields },
    { title: 'Selection Fields', fields: selectionFields },
    { title: 'Advanced Fields', fields: advancedFields },
    { title: 'Buttons', fields: buttonFields },
  ];

  const addField = (fieldType) => {
    const field = {
      id: `field_${Date.now()}`,
      type: fieldType,
      label: fieldType === 'submit' ? 'Submit' : fieldType === 'reset' ? 'Reset' : `${fieldType} Field`,
      required: false,
      placeholder: '',
    };
    if (fieldType === 'select' || fieldType === 'radio') {
      field.options = ['Option 1', 'Option 2', 'Option 3'];
    }
    setBuilderForm({
      ...builderForm,
      fields: [...builderForm.fields, field],
    });
  };

  const updateField = (id, updates) => {
    setBuilderForm({
      ...builderForm,
      fields: builderForm.fields.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const removeField = (id) => {
    setBuilderForm({
      ...builderForm,
      fields: builderForm.fields.filter((f) => f.id !== id),
    });
  };

  const moveField = (index, direction) => {
    const newFields = [...builderForm.fields];
    if (direction === -1 && index > 0) {
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
    } else if (direction === 1 && index < newFields.length - 1) {
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
    }
    setBuilderForm({ ...builderForm, fields: newFields });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="lg:w-64 shrink-0">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Field Types</h3>
        <div className="space-y-4">
          {allFieldGroups.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-medium text-slate-500 mb-2">{group.title}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.fields.map((field) => (
                  <button
                    key={field.type}
                    onClick={() => addField(field.type)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <span>{field.icon}</span>
                    <span className="truncate">{field.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Form Fields</h3>
        {builderForm.fields.length === 0 ? (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 text-sm">No fields added yet. Click a field type to add it.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {builderForm.fields.map((field, index) => (
              <div key={field.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => moveField(index, -1)} className="text-slate-400 hover:text-primary-600" disabled={index === 0}>
                        ↑
                      </button>
                      <button onClick={() => moveField(index, 1)} className="text-slate-400 hover:text-primary-600" disabled={index === builderForm.fields.length - 1}>
                        ↓
                      </button>
                    </div>
                    <span className="text-sm font-medium text-slate-700">{field.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 capitalize">{field.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      <input type="checkbox" checked={field.required} onChange={(e) => updateField(field.id, { required: e.target.checked })} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                      Required
                    </label>
                    <button onClick={() => removeField(field.id)} className="text-slate-400 hover:text-red-600 p-1">
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 pl-8">
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    placeholder="Field label"
                  />
                  {field.type !== 'submit' && field.type !== 'reset' && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'file' && (
                    <input
                      type="text"
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      placeholder="Placeholder text"
                    />
                  )}
                  {(field.type === 'select' || field.type === 'radio') && (
                    <input
                      type="text"
                      value={field.options?.join(', ') || ''}
                      onChange={(e) => updateField(field.id, { options: e.target.value.split(',').map((o) => o.trim()) })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      placeholder="Options (comma separated)"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
