export interface MLQuestion {
  id: string
  level: 'soft' | 'hard'
  text: string
}

export const ML_QUESTIONS: MLQuestion[] = [
  // Soft
  { id: 'ml_s1', level: 'soft', text: 'Qui pourrait s\'endormir le premier en pleine soirée ?' },
  { id: 'ml_s2', level: 'soft', text: 'Qui pourrait commander un Uber pour faire moins de 300 mètres ?' },
  { id: 'ml_s3', level: 'soft', text: 'Qui pourrait oublier son code de carte bleue au moment de payer l\'addition ?' },
  // Hard
  { id: 'ml_h1', level: 'hard', text: 'Qui pourrait appeler son ex en pleurant après 3 verres de trop ?' },
  { id: 'ml_h2', level: 'hard', text: 'Qui pourrait se réveiller dans une ville inconnue sans savoir comment il est arrivé là ?' },
  { id: 'ml_h3', level: 'hard', text: 'Qui pourrait finir la soirée en train de danser sur les tables (ou finir torse nu) ?' },
]
