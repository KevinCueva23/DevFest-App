export interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  image?: string;
  videoUri?: string;
  timestamp: number;
  thinking?: boolean;
}

export enum Tab {
  VISION = 'vision',
  REASONING = 'reasoning',
  VIDEO = 'video',
  TRAINING = 'training'
}

export interface GeneratedVideo {
  uri: string;
  mimeType?: string;
}

export interface TrainingExample {
  id: string;
  input: string;
  output: string;
}

export interface TrainingDocument {
  id: string;
  name: string;
  base64: string;
  mimeType: string;
  size: number;
}