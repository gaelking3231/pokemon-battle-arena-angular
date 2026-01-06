import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { Pokemon } from '../models/pokemon.interface';

@Injectable({
  providedIn: 'root'
})
export class PokemonService {
  private apiUrl = 'https://pokeapi.co/api/v2/pokemon';

  constructor(private http: HttpClient) { }

  // --- OBTENER EQUIPO ALEATORIO (TODAS LAS GENERACIONES) ---
  getTeam(): Observable<Pokemon[]> {
    // Generamos 5 IDs aleatorios entre el 1 y el 1025
    const randomIds = Array.from({ length: 5 }, () => Math.floor(Math.random() * 1025) + 1);
    
    const requests = randomIds.map(id => this.getPokemonById(id));
    return forkJoin(requests);
  }

  // --- OBTENER DATOS DE UN POKÉMON ---
  private getPokemonById(id: number): Observable<Pokemon> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        // 10% de probabilidad de ser Shiny
        const isShiny = Math.random() < 0.10; 
        
        // Buscamos la imagen. Si es de gen muy nueva, a veces no tiene "official-artwork", 
        // así que usamos un fallback (seguro) si es necesario, aunque official-artwork cubre casi todo.
        let imageUrl = isShiny 
            ? response.sprites.other['official-artwork'].front_shiny 
            : response.sprites.other['official-artwork'].front_default;

        // Si no hay imagen oficial (pasa en algunos muy nuevos), usamos la sprite normal
        if (!imageUrl) {
            imageUrl = isShiny ? response.sprites.front_shiny : response.sprites.front_default;
        }

        return {
          id: response.id,
          name: response.name,
          image: imageUrl,
          hp: response.stats[0].base_stat,
          maxHp: response.stats[0].base_stat,
          attack: response.stats[1].base_stat,
          defense: response.stats[2].base_stat,
          speed: response.stats[5].base_stat,
          type: response.types[0].type.name,
          // Elegimos 4 movimientos al azar
          moves: this.getRandomMoves(response.moves),
          // Iniciamos la carga del ataque especial en 0
          ultimateCharge: 0 
        };
      })
    );
  }

  // --- HELPER PARA MOVIMIENTOS ---
  private getRandomMoves(allMoves: any[]): any[] {
    // Si el pokemon tiene menos de 4 ataques, los agarramos todos
    if (allMoves.length < 4) {
        return allMoves.map((m: any) => ({
            name: m.move.name.replace(/-/g, ' '),
            url: m.move.url
        }));
    }

    // Si tiene muchos, revolvemos y agarramos 4
    const shuffled = allMoves.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).map((m: any) => ({
      name: m.move.name.replace(/-/g, ' '), // Quitamos guiones (tackle-attack -> tackle attack)
      url: m.move.url
    }));
  }
}