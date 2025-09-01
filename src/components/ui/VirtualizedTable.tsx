import React, { useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';

interface VirtualizedTableProps<T> {
  data: T[];
  height: number;
  itemHeight: number;
  columns: Array<{
    key: keyof T;
    header: string;
    width?: number;
    render?: (value: any, item: T) => React.ReactNode;
  }>;
  onRowClick?: (item: T) => void;
  className?: string;
}

function VirtualizedTable<T>({
  data,
  height,
  itemHeight,
  columns,
  onRowClick,
  className = ''
}: VirtualizedTableProps<T>) {
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const item = data[index];
    
    return (
      <div
        style={style}
        className={`flex items-center border-b border-gray-200 hover:bg-gray-50 cursor-pointer ${
          index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
        }`}
        onClick={() => onRowClick?.(item)}
      >
        {columns.map((column, colIndex) => {
          const value = item[column.key];
          const content = column.render ? column.render(value, item) : String(value || '');
          
          return (
            <div
              key={colIndex}
              className="px-4 py-2 text-sm text-gray-900 truncate"
              style={{ width: column.width || `${100 / columns.length}%` }}
            >
              {content}
            </div>
          );
        })}
      </div>
    );
  }, [data, columns, onRowClick]);

  const Header = useMemo(() => (
    <div className="flex items-center bg-gray-50 border-b border-gray-200 font-medium text-gray-700">
      {columns.map((column, index) => (
        <div
          key={index}
          className="px-4 py-3 text-sm font-medium text-gray-700 uppercase tracking-wider"
          style={{ width: column.width || `${100 / columns.length}%` }}
        >
          {column.header}
        </div>
      ))}
    </div>
  ), [columns]);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {Header}
      <List
        height={height}
        itemCount={data.length}
        itemSize={itemHeight}
        overscanCount={5}
      >
        {Row}
      </List>
    </div>
  );
}

export default VirtualizedTable;