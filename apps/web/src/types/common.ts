// Utility types for the application

export type NonEmptyArray<T> = [T, ...T[]];

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Game-related types
export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  position: Position;
  avatar?: string;
  isOnline: boolean;
}

export interface GameState {
  players: Record<string, Player>;
  currentPlayerId: string | null;
}
