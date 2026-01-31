
export interface Star {
  id: string;
  name: string;
  constellation: string;
  magnitude: number;
  color: string;
  x: number;
  y: number;
  fact: string;
  mythology: string;
}

export interface Riddle {
  text: string;
  targetStarId: string;
  isCustom?: boolean;
  acceptedAnswers?: string[];
  hints?: string[];
  imageUrls?: string[];
}

export interface Score {
  currentRiddleIndex: number;
  totalErrors: number;
}

export enum GameState {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  MENU = 'MENU',
  START = 'START',
  PLAYING = 'PLAYING',
  SOLVED = 'SOLVED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  COMPLETED = 'COMPLETED',
  ADMIN = 'ADMIN'
}

export interface VerificationRequest {
  id: string;
  teamName: string;
  starName: string;
  timestamp: number;
  status: 'pending' | 'approved' | 'rejected';
  type: 'discovery' | 'pointing' | 'submission';
  submittedAnswer?: string;
  section?: number;
}

export interface TeamProfile {
  id?: string;
  name: string;
  points: number;
  starsFound: number;
  role: 'user' | 'admin';
  currentSection?: number;
  solvedIndices?: number[];
  attempts?: Record<string, number>; // key: "section-index"
  hasRequestedPointing?: boolean;
  forgetPasswordClicked?: boolean;
  tabletDiscovered?: boolean;
}

export interface GameConfig {
  sections_1_2_unlocked: boolean;
  section_3_unlocked: boolean;
}
