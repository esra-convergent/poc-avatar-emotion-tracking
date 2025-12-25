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
  // NOTE: Disabled because using LiveKit native avatar (bitHuman/Tavus/Hedra)
  // The avatar comes from the Python agent and appears as a video track
  avatar: {
    enabled: false, // Disabled - using LiveKit avatar instead
    type: 'readyplayerme',
    vrmUrl: '/avatars/default-avatar.vrm',
    glbUrl: 'https://models.readyplayer.me/694bd631220569853f2ea05b.glb',
    allowCustomUpload: false,
  },
};
