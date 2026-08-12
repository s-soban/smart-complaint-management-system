import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Category, Building } from '../../types';
import { Wrench, Building2, PlusCircle, CheckCircle } from 'lucide-react';

export const CategoryManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);

  // Category Modal
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatPrio, setNewCatPrio] = useState('medium');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [cRes, bRes] = await Promise.all([api.getCategories(), api.getBuildings()]);
    if (cRes.success) setCategories(cRes.categories);
    if (bRes.success) setBuildings(bRes.buildings);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await api.saveCategory({
        name: newCatName,
        description: newCatDesc,
        default_priority: newCatPrio
      });
      if (res.success) {
        setNewCatName('');
        setNewCatDesc('');
        loadData();
      }
    } catch (err) {
      alert('Failed to save category');
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Wrench className="w-5 h-5 text-blue-400" /> Categories & Location Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure complaint categories, default priority baselines, and campus buildings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Categories List */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
            Facility Complaint Categories ({categories.length})
          </h3>

          <form onSubmit={handleAddCategory} className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <h4 className="font-bold text-slate-700 dark:text-slate-200">Add Custom Category</h4>
            <input
              type="text"
              placeholder="Category Name (e.g. Solar Equipment)"
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <input
              type="text"
              placeholder="Description"
              value={newCatDesc}
              onChange={e => setNewCatDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
            />
            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md"
            >
              Add Category
            </button>
          </form>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {categories.map(c => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                  <p className="text-slate-400 text-[11px]">{c.description}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 font-bold uppercase text-[10px]">
                  {c.default_priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Buildings List */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
            Campus Buildings & Infrastructure Complexes ({buildings.length})
          </h3>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {buildings.map(b => (
              <div key={b.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{b.name} ({b.code})</span>
                  <p className="text-slate-400 text-[11px]">{b.description}</p>
                </div>
                <span className="font-mono text-slate-400 font-bold text-[10px]">
                  {b.total_floors} floors
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
