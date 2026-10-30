import { AppTheme } from '../types';

export interface ThemeColors {
  name: AppTheme;
  isLight: boolean;
  bg: string;
  headerBg: string;
  headerBorder: string;
  headerText: string;
  headerSubtext: string;
  myBubble: string;
  myBubbleText: string;
  myBubbleMeta: string;
  partnerBubble: string;
  partnerBubbleText: string;
  partnerBubbleMeta: string;
  inputContainerBg: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  actionBg: string;
  actionText: string;
  checkColor: string;
  doodleColor: string;
  doodleOpacity: number;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  systemMessageBg: string;
  border: string;
}

export function getSystemTheme(): 'whatsapp' | 'light' {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'whatsapp';
  }
  return 'light';
}

export function resolveTheme(theme: AppTheme): ThemeColors {
  const active = theme === 'system' ? getSystemTheme() : (theme || 'light');

  if (active === 'light') {
    return {
      name: 'light',
      isLight: true,
      bg: '#efeae2',
      headerBg: '#008069',
      headerBorder: '#00705b',
      headerText: '#ffffff',
      headerSubtext: '#d1f4ec',
      myBubble: '#d9fdd3',
      myBubbleText: '#111b21',
      myBubbleMeta: '#667781',
      partnerBubble: '#ffffff',
      partnerBubbleText: '#111b21',
      partnerBubbleMeta: '#667781',
      inputContainerBg: '#f0f2f5',
      inputBg: '#ffffff',
      inputBorder: '#e2e8f0',
      inputText: '#111b21',
      inputPlaceholder: '#8696a0',
      actionBg: '#008069',
      actionText: '#ffffff',
      checkColor: '#53bdeb',
      doodleColor: '#000000',
      doodleOpacity: 0.06,
      accent: '#008069',
      textPrimary: '#111b21',
      textSecondary: '#667781',
      systemMessageBg: '#ffffffcc',
      border: '#e2e8f0',
    };
  }

  if (active === 'dark') {
    return {
      name: 'dark',
      isLight: false,
      bg: '#09090b',
      headerBg: '#18181b',
      headerBorder: '#27272a',
      headerText: '#ffffff',
      headerSubtext: '#a1a1aa',
      myBubble: '#be123c',
      myBubbleText: '#ffffff',
      myBubbleMeta: '#fda4af',
      partnerBubble: '#27272a',
      partnerBubbleText: '#f4f4f5',
      partnerBubbleMeta: '#a1a1aa',
      inputContainerBg: '#121215',
      inputBg: '#18181b',
      inputBorder: '#27272a',
      inputText: '#ffffff',
      inputPlaceholder: '#71717a',
      actionBg: '#e11d48',
      actionText: '#ffffff',
      checkColor: '#38bdf8',
      doodleColor: '#ffffff',
      doodleOpacity: 0.03,
      accent: '#f43f5e',
      textPrimary: '#f4f4f5',
      textSecondary: '#a1a1aa',
      systemMessageBg: '#18181bcc',
      border: '#27272a',
    };
  }

  // Default: WhatsApp Dark Mode
  return {
    name: 'whatsapp',
    isLight: false,
    bg: '#0b141a',
    headerBg: '#1f2c34',
    headerBorder: '#2a3942',
    headerText: '#e9edef',
    headerSubtext: '#8696a0',
    myBubble: '#005c4b',
    myBubbleText: '#e9edef',
    myBubbleMeta: '#8696a0',
    partnerBubble: '#202c33',
    partnerBubbleText: '#e9edef',
    partnerBubbleMeta: '#8696a0',
    inputContainerBg: '#1f2c34',
    inputBg: '#2a3942',
    inputBorder: '#374248',
    inputText: '#e9edef',
    inputPlaceholder: '#8696a0',
    actionBg: '#00a884',
    actionText: '#ffffff',
    checkColor: '#53bdeb',
    doodleColor: '#ffffff',
    doodleOpacity: 0.04,
    accent: '#00a884',
    textPrimary: '#e9edef',
    textSecondary: '#8696a0',
    systemMessageBg: '#182229cc',
    border: '#2a3942',
  };
}
