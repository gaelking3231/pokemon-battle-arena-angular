import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { Pokemon } from '../models/pokemon.interface';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // 1. Crear Sala (Host)
  async createRoom(code: string, team: Pokemon[]) {
    const { data, error } = await this.supabase
      .from('battles')
      .insert({
        code: code,
        player1_team: team,
        current_turn: 'player1',
        status: 'waiting'
      })
      .select()
      .single();
    return { data, error };
  }

  // 2. Unirse a Sala (Guest)
  async joinRoom(code: string, team: Pokemon[]) {
    const { data: room } = await this.supabase.from('battles').select('*').eq('code', code).single();
    if (!room) return { error: 'Sala no encontrada' };

    const { data, error } = await this.supabase
      .from('battles')
      .update({
        player2_team: team,
        status: 'playing'
      })
      .eq('code', code)
      .select()
      .single();
    return { data, error };
  }

  // 3. Escuchar en Tiempo Real
  listenToBattle(code: string, callback: (payload: any) => void) {
    return this.supabase
      .channel('battle_' + code)
      .on('postgres_changes', 
          { event: 'UPDATE', schema: 'public', table: 'battles', filter: `code=eq.${code}` }, 
          (payload) => callback(payload.new)
      )
      .subscribe();
  }

  // 4. Enviar Ataque / Actualización
  async sendUpdate(code: string, p1Team: any, p2Team: any, nextTurn: string, status: string | null) {
    const updateData: any = {
      player1_team: p1Team,
      player2_team: p2Team,
      current_turn: nextTurn
    };
    if (status) updateData.status = status;

    await this.supabase.from('battles').update(updateData).eq('code', code);
  }

  // 5. Red de Seguridad (Polling)
  async getRoom(code: string) {
    const { data } = await this.supabase.from('battles').select('*').eq('code', code).single();
    return data;
  }

  // 6. Guardar Score
  async saveScore(playerName: string) {
    await this.supabase.from('scores').insert({
      player_name: playerName
    });
  }

  // 7. OBTENER LEADERBOARD (¡ESTA ES LA QUE FALTABA!)
  async getLeaderboard() {
    const { data } = await this.supabase
      .from('scores')
      .select('*')
      .order('date', { ascending: false }) // Los más recientes primero
      .limit(10); // Solo los últimos 10
    return data;
  }
}