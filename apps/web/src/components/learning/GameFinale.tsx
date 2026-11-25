'use client';
import React from 'react';
import './game-finale.css';

/**
 * Closing note on the reward screen of a game's final chapter. Without it the
 * last chapter looked like any other one whose "next" button had vanished.
 * Each game shows it only when the whole game is really done (its last
 * chapter in order, or every lesson saved). Presentational: stores nothing.
 */
export function GameFinale({title,detail,tone='light'}:{title:string;detail:string;tone?:'light'|'dark'}){
 return <div className="game-finale" data-tone={tone}>
  <span className="game-finale-medal" aria-hidden="true">🏅</span>
  <span className="game-finale-copy">
   <strong className="game-finale-title">{title}</strong>
   <span className="game-finale-detail">{detail}</span>
  </span>
 </div>;
}
