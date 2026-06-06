import React from 'react';

export default function FormPreview({ form, device }) {
  const previewFields = form?.fields || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-card">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-600">Preview: {form?.name || 'Form'}</span>
        <span className="text-xs px-2 py-1 rounded-full bg-primary-50 text-primary-600 capitalize">{device}</span>
      </div>
      <div className="p-6">
        <div className={`mx-auto ${device === 'desktop' ? 'max-w-2xl' : device === 'tablet' ? 'max-w-lg' : 'max-w-sm'}`}>
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">{form?.name || 'Form Preview'}</h2>
            {form?.description && <p className="text-sm text-slate-500 mt-1">{form.description}</p>}
          </div>
          <div className="space-y-4">
            {previewFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    placeholder={field.placeholder}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400 resize-none"
                    rows={3}
                  />
                ) : field.type === 'select' ? (
                  <select disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400">
                    <option>Select an option...</option>
                    {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
                  </select>
                ) : field.type === 'radio' ? (
                  <div className="space-y-2">
                    {field.options?.map((opt, i) => (
                      <label key={i} className="flex items-center gap-2 text-sm text-slate-500">
                        <input type="radio" name={field.id} disabled className="border-slate-300 text-primary-600" />{opt}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'file' ? (
                  <input type="file" disabled className="text-sm text-slate-400" />
                ) : field.type === 'date' ? (
                  <input type="date" disabled className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400" />
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm text-slate-500"><input type="checkbox" disabled />{field.placeholder || 'I agree'}</label>
                ) : field.type === 'rating' ? (
                  <div className="flex gap-1 text-lg">⭐ ⭐ ⭐ ⭐ ⭐</div>
                ) : field.type === 'address' ? (
                  <input type="text" disabled placeholder={field.placeholder || 'Street, City, State, Zip'} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400" />
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    disabled
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400"
                  />
                )}
              </div>
            ))}
            {previewFields.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No fields to preview.</p>}
          </div>
          <div className="mt-6 flex gap-3">
            <button disabled className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium opacity-50">Submit</button>
            <button disabled className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium opacity-50">Reset</button>
          </div>
        </div>
      </div>
    </div>
  );
}
