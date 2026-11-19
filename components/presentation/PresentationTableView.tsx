'use client';

import React from 'react';
import { resolveTableColumnWidths } from '@/lib/presentation/presentation-table-view';
import type { TableBlock } from '@/lib/deck-types';
import { MarkupText } from '../page/pageedit/PageEditMarkupText';

interface TableViewProps {
  block: TableBlock;
  live: boolean;
  insideModal?: boolean;
  onTermClick: (term: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onModalClick?: (title: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}

export function TableView({
  block,
  live,
  insideModal = false,
  onTermClick,
  onModalClick,
}: TableViewProps) {
  const headers = block.headers.length > 0 ? block.headers : ['Kolom 1'];
  const rows = block.rows.length > 0 ? block.rows : [headers.map(() => '')];
  const layout = resolveTableColumnWidths(headers.length, block.colWidths);

  return (
    <div className="ptbl-wrap">
      <table
        className="ptbl"
        data-layout-mode={layout.isCustom ? 'manual' : 'equal'}
        data-col-widths={layout.widths.map((w) => Number(w.toFixed(2))).join(',')}
      >
        <colgroup>
          {layout.widths.map((pct, colIdx) => (
            <col key={colIdx} style={{ width: `${pct}%` }} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {headers.map((headerText, colIdx) => (
              <th key={colIdx} scope="col">
                {headerText ? (
                  <MarkupText
                    text={headerText}
                    live={live}
                    insideModal={insideModal}
                    onTermClick={onTermClick}
                    onModalClick={onModalClick}
                  />
                ) : (
                  <span className="opacity-45">{`Kolom ${colIdx + 1}`}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {headers.map((_, colIdx) => {
                const cell = row?.[colIdx] ?? '';
                return (
                  <td key={colIdx}>
                    {cell ? (
                      <MarkupText
                        text={cell}
                        live={live}
                        insideModal={insideModal}
                        onTermClick={onTermClick}
                        onModalClick={onModalClick}
                      />
                    ) : (
                      '\u00A0'
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
