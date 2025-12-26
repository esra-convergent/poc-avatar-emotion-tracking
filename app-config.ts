export interface AppConfig {
  pageTitle: string;
  pageDescription: string;
  companyName: string;

  supportsChatInput: boolean;
  supportsVideoInput: boolean;
  supportsScreenShare: boolean;
  isPreConnectBufferEnabled: boolean;

  logo: string;
  startButtonText: string;
  accent?: string;
  logoDark?: string;
  accentDark?: string;

  // for LiveKit Cloud Sandbox
  sandboxId?: string;
  agentName?: string;

  // Avatar Configuration
  avatar?: {
    enabled: boolean;
    type: 'vrm' | 'readyplayerme'; // Avatar type
    vrmUrl?: string; // For VRM avatars
    glbUrl?: string; // For Ready Player Me avatars
    allowCustomUpload?: boolean;
  };
}

export const APP_CONFIG_DEFAULTS: AppConfig = {
  companyName: 'LiveKit',
  pageTitle: 'LiveKit Voice Agent',
  pageDescription: 'A voice agent built with LiveKit',

  supportsChatInput: true,
  supportsVideoInput: true,
  supportsScreenShare: true,
  isPreConnectBufferEnabled: true,

  logo: '/lk-logo.svg',
  accent: '#002cf2',
  logoDark: '/lk-logo-dark.svg',
  accentDark: '#1fd5f9',
  startButtonText: 'Start call',

  // for LiveKit Cloud Sandbox
  sandboxId: undefined,
  agentName: undefined,

  // Avatar Configuration
  // Client-side Ready Player Me avatar with real-time lip-sync
  avatar: {
    enabled: true, // Enabled - using client-side Ready Player Me avatar
    type: 'readyplayerme',
    vrmUrl: '/avatars/default-avatar.vrm',
    glbUrl: '/models/646d9dcdc8a5f5bddbfac913.glb', // Local Ready Player Me model
    allowCustomUpload: false,
  },
};
