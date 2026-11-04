'use client';
import React from 'react';
import './word-garden-quiet.css';

/** Progressive disclosure for nonessential explanations.
 * Reading is optional for young players, but the instructions remain
 * keyboard/screen-reader accessible and available to parents/teachers.
 */
export function GardenHelp({children,label='Nasıl oynanır?'}:{
 children:React.ReactNode;label?:string
}) {
 return <details className="wg-game-help">
  <summary title={label} aria-label={label}><span aria-hidden="true">?</span></summary>
  <div className="wg-game-help-body">{children}</div>
 </details>;
}
