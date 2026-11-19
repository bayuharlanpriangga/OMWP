import type { AiProviderId } from './ai/ai-providers';

export type ThemeId =
  | 'default'
  | 'brutal'
  | 'auditor'
  | 'cyberpunk'
  | 'hacker'
  | 'astronomi'
  | 'ghost'
  | 'halloween'
  | 'aquarium'
  | 'detective'
  | 'summer'
  | 'pixel'
  | 'dino'
  | 'zodiac'
  | 'tarot'
  | 'joker'
  | 'ai';
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
  i?: boolean;
  u?: boolean;
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
  colWidths?: number[];
}

export interface TitleBlock extends BaseBlock {
  t: 'title';
  text: string;
}

export type ChartType = 'column' | 'pie' | 'line' | 'bar' | 'sunburst';

export interface ChartSeries {
  id: string;
  name: string;
  values: number[];
}

export interface ChartBlock extends BaseBlock {
  t: 'chart';
  chartType: ChartType;
  title?: string;
  categories: string[];
  series: ChartSeries[];
}

export type Block =
  | TextBlock
  | TitleBlock
  | DropdownBlock
  | ImageBlock
  | BoxBlock
  | ConclusionBlock
  | TableBlock
  | ChartBlock;

export interface SlideModal {
  id: string;
  title: string;
  children: Block[];
}

export interface Slide {
  id: string;
  name: string;
  headerTitle?: string;
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
  preferredModels?: Partial<Record<AiProviderId, string>>;
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
  | { type: 'italic'; children: InlineToken[] }
  | { type: 'underline'; children: InlineToken[] }
  | { type: 'size'; size: 's' | 'm' | 'l' | 'xl'; children: InlineToken[] }
  | { type: 'ai-term'; term: string }
  | { type: 'modal-trigger'; title: string };
