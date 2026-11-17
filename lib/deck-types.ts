import type { AiProviderId } from './ai-providers';

export type ThemeId = 'default' | 'brutal' | 'auditor';
export type WorkspaceMode = 'present' | 'edit' | 'layout';
export type TextSize = 's' | 'm' | 'l' | 'xl' | 'xxl';
export type TextAlign = 'l' | 'c' | 'r';
export type AiStyle = 'concise' | 'academic' | 'examples';

export interface BaseBlock {
  id: string;
  w: number;
  x?: number;
  y?: number;
  align?: TextAlign;
}

export interface TextBlock extends BaseBlock {
  t: 'text';
  text: string;
  size: TextSize;
  align: TextAlign;
  b?: boolean;
}

export interface DropdownBlock extends BaseBlock {
  t: 'dd';
  badge?: string;
  text: string;
  detail: string;
}

export interface ImageBlock extends BaseBlock {
  t: 'img';
  src: string;
  alt: string;
}

export interface BoxBlock extends BaseBlock {
  t: 'box';
  title: string;
  children: Block[];
}

export interface ConclusionBlock extends BaseBlock {
  t: 'concl';
  label: string;
  text: string;
}

export interface TableBlock extends BaseBlock {
  t: 'table';
  headers: string[];
  rows: string[][];
}

export type Block =
  | TextBlock
  | DropdownBlock
  | ImageBlock
  | BoxBlock
  | ConclusionBlock
  | TableBlock;

export interface SlideModal {
  id: string;
  title: string;
  children: Block[];
}

export interface Slide {
  id: string;
  name: string;
  bg?: string;
  vc?: boolean;
  blocks: Block[];
  modals?: SlideModal[];
  mold?: Record<string, SlideModal>;
}

export interface Deck {
  v: 2;
  title: string;
  theme: ThemeId;
  slides: Slide[];
}

export interface LegacySlide {
  title?: string;
  points?: Array<{ text?: string; detail?: string }>;
  conclusion?: string;
}

export interface LegacyDeck {
  v?: number;
  title?: string;
  theme?: ThemeId;
  conclusion?: string;
  slides?: LegacySlide[];
}

export interface PresenterPrefs {
  preferredProvider?: AiProviderId | null;
  includeKeysInExport?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'error';
  text: string;
  animate?: boolean;
  done?: boolean;
}

export interface SlideAiContext {
  deckTitle: string;
  slideTitle: string;
  slideNumber?: number;
  totalSlides?: number;
  slideText: string;
  pointsText: string;
  slideContentOutline?: string;
  deckOverview?: string;
  clickedTerm?: string;
  surroundingContext?: string;
}

export type InlineToken =
  | { type: 'text'; value: string }
  | { type: 'br' }
  | { type: 'bold'; children: InlineToken[] }
  | { type: 'size'; size: 's' | 'm' | 'l' | 'xl'; children: InlineToken[] }
  | { type: 'ai-term'; term: string }
  | { type: 'modal-trigger'; title: string };
