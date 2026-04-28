export type TodDifficulty = 'soft' | 'medium' | 'hard'

export interface TodQuestion {
  id: string
  type: 'truth' | 'dare'
  difficulty: TodDifficulty
  text: string
}

export const TOD_QUESTIONS: TodQuestion[] = [
  {
    id: 't1',
    type: 'truth',
    difficulty: 'soft',
    text: 'Quel est ton pire tue-l\'amour ?'
  },
  {
    id: 't2',
    type: 'truth',
    difficulty: 'hard',
    text: 'Quelle est la chose la plus illégale que tu aies faite ?'
  },
  {
    id: 'd1',
    type: 'dare',
    difficulty: 'soft',
    text: 'Montre la dernière photo de ta pellicule.'
  },
  {
    id: 'd2',
    type: 'dare',
    difficulty: 'hard',
    text: 'Laisse le joueur de ton choix envoyer un message à ton ex.'
  }
]
