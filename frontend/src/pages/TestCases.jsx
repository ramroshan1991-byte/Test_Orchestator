import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Download, Eye, Copy, Trash2, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../store/appStore';
import { exportToMarkdown, exportToJSON, generateTestCasesMarkdown, exportToPDF } from '../utils/exportUtils';
import { TableSkeletonLoader } from '../components/SkeletonLoader';

function TestCases({ onShowToast, onNavigate, darkMode }) {
  const { testCases: storeTestCases, deleteTestCase } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const testCasesArray = useMemo(() => Object.values(storeTestCases || {}).flat(), [storeTestCases]);

  const filteredCases = testCasesArray.filter((tc) => {
    const matchSearch = tc.id?.toLowerCase().includes(searchTerm.toLowerCase()) || tc.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || tc.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredCases.length / ITEMS_PER_PAGE);
  const paginatedCases = filteredCases.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pass': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'Fail': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'Skip': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  const textClass = darkMode ? 'text-white' : 'text-gray-900';
  const subTextClass = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardClass = darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200 shadow-sm';
  const inputClass = darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${textClass}`}>Test Cases</h1>
          <p className={subTextClass}>Manage and execute your test cases</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold">
          <Plus size={20} />
          New Test Case
        </button>
      </div>

      <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center ${cardClass}`}>
        <div className="flex-1 relative w-full">
          <Search size={18} className="absolute left-3 top-2.5 text-gray-500" />
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search test cases..." className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none ${inputClass}`} />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`flex-1 md:w-40 p-2 rounded-lg border outline-none ${inputClass}`}>
            <option>All Status</option>
            <option>Pass</option>
            <option>Fail</option>
            <option>Skip</option>
          </select>
          <button onClick={() => onShowToast('Exporting...', 'info')} className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-medium ${darkMode ? 'border-slate-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}>
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      <div className={`rounded-xl border overflow-hidden ${cardClass}`}>
        <table className="w-full text-left">
          <thead className={`border-b ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <tr>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${subTextClass}`}>ID</th>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${subTextClass}`}>Title</th>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${subTextClass}`}>Status</th>
              <th className={`px-6 py-4 text-xs font-bold uppercase tracking-wider ${subTextClass}`}>Priority</th>
              <th className={`px-6 py-4 text-right ${subTextClass}`}>Actions</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${darkMode ? 'divide-slate-700' : 'divide-gray-100'}`}>
            {paginatedCases.length > 0 ? paginatedCases.map((tc) => (
              <tr key={tc.id} className={`group ${darkMode ? 'hover:bg-slate-700/30' : 'hover:bg-gray-50'}`}>
                <td className="px-6 py-4 font-mono text-sm text-blue-500 font-bold">{tc.id}</td>
                <td className={`px-6 py-4 text-sm font-medium ${textClass}`}>{tc.title}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusColor(tc.status)}`}>{tc.status}</span>
                </td>
                <td className={`px-6 py-4 text-sm ${tc.priority === 'High' ? 'text-red-500' : 'text-blue-500'}`}>{tc.priority}</td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-gray-400 hover:text-blue-500"><Eye size={16} /></button>
                  <button onClick={() => deleteTestCase(tc.planId, tc.id)} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="p-10 text-center text-gray-500">No test cases found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default TestCases;
