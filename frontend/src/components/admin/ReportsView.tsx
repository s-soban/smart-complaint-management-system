import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Download, FileSpreadsheet, Printer, Calendar, CheckCircle } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const res = await api.getReports();
      if (res.success) {
        setReportsData(res.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (reportsData.length === 0) return;

    const headers = ['ID', 'Title', 'Category', 'Building', 'Room', 'Priority', 'Status', 'Submitted By', 'Department', 'Assigned Staff', 'Submitted Date', 'Resolved Date'];
    const rows = reportsData.map(r => [
      r.id,
      `"${r.title.replace(/"/g, '""')}"`,
      r.category,
      r.building,
      r.room_area,
      r.priority,
      r.status,
      r.student_name,
      r.department,
      r.maintenance_staff || 'Unassigned',
      r.created_at,
      r.resolved_at || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Campus_Complaint_Report_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl flex items-center justify-between">
        <div>
          <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-extrabold uppercase tracking-wider border border-blue-500/30">
            Institutional Audit & Reporting
          </span>
          <h2 className="text-xl font-black mt-2 tracking-tight">
            Executive Summary Reports Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export compliance records, resolution timelines, and maintenance performance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={exportCSV}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-md hover:bg-emerald-500 transition-colors flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" /> Export CSV Data
          </button>
          <button
            onClick={printReport}
            className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-extrabold text-xs border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print PDF Summary
          </button>
        </div>
      </div>

      {/* Reports Audit Table */}
      <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm mb-4">
          Master Complaints Audit Ledger ({reportsData.length} entries)
        </h3>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 font-bold text-xs">
            Compiling institutional report records...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Assigned Staff</th>
                  <th className="py-3 px-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {reportsData.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{r.id}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{r.title}</td>
                    <td className="py-3 px-4">{r.category}</td>
                    <td className="py-3 px-4">{r.building} - {r.room_area}</td>
                    <td className="py-3 px-4 font-bold uppercase">{r.priority}</td>
                    <td className="py-3 px-4 font-bold">{r.status}</td>
                    <td className="py-3 px-4">{r.student_name} ({r.department})</td>
                    <td className="py-3 px-4">{r.maintenance_staff || 'Unassigned'}</td>
                    <td className="py-3 px-4 text-slate-400">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
