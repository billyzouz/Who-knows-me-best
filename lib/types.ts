export type RoomStatus = 'waiting' | 'questions' | 'playing' | 'finished'
export type GamePhase = 'answering' | 'guessing' | 'validating' | 'reveal'

export interface Room {
  id: string
  code: string
  host_id: string | null
  status: RoomStatus
  created_at: string
}

export interface Player {
  id: string
  room_id: string
  name: string
  score: number
  is_host: boolean
  created_at: string
}

export interface Question {
  id: string
  room_id: string
  author_id: string
  text: string
  answer: string
  created_at: string
}

export interface Guess {
  id: string
  question_id: string
  player_id: string
  guess: string
  is_correct: boolean
  created_at: string
}

export interface GameState {
  id: string
  room_id: string
  current_subject_id: string | null
  current_question_idx: number
  phase: GamePhase
  updated_at: string
}
