import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: React.ReactNode[] | string[];
}

export const Table: React.FC<TableProps> = ({ headers, children, className = '', ...props }) => {
  return (
    <div className="gqg-table-shell">
      <table className={`w-full border-collapse text-left text-sm text-slate-500 ${className}`} {...props}>
        <thead className="bg-slate-50 text-xs font-semibold text-slate-700 uppercase tracking-wider border-b-2 border-slate-300">
          <tr>
            {headers.map((header, index) => (
              <th key={index} className="px-6 py-4 font-semibold text-slate-700">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  );
};
