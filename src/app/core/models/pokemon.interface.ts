// Definimos qué es un movimiento
export interface Move {
  name: string;
  url: string; // Guardamos la URL por si en el futuro quieres meterle daño real/tipo
}

// Actualizamos la interfaz principal
export interface Pokemon {
  id: number;
  name: string;
  image: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  type: string;
  // --- NUEVO CAMPO ---
  moves: Move[]; 
}