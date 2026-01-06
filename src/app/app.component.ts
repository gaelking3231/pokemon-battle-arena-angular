import { Component, OnInit, inject, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from './core/services/supabase.service';
import { PokemonService } from './core/services/pokemon.service';
import { AudioService } from './core/services/audio.service';
import { Pokemon } from './core/models/pokemon.interface';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  private supabase = inject(SupabaseService);
  private pokeService = inject(PokemonService);
  private audio = inject(AudioService);
  private ngZone = inject(NgZone);
  private http = inject(HttpClient);

  view: 'MENU' | 'LOBBY' | 'BATTLE' | 'LEADERBOARD' = 'MENU';
  gameMode: 'ONLINE' | 'VS_BOT' = 'ONLINE';
  
  roomCode: string = '';
  myPlayerId: 'player1' | 'player2' | null = null;
  playerName: string = '';

  myTeam: Pokemon[] = [];
  enemyTeam: Pokemon[] = [];
  myPokemon: Pokemon | null = null;
  enemyPokemon: Pokemon | null = null;
  
  battleLog: string[] = [];
  currentTurn: string = ''; 
  winner: string | null = null;
  
  animatingDamage: boolean = false; 
  animatingAttack: boolean = false; 
  playerDamaged: boolean = false;
  
  floatingTextPlayer: string | null = null;
  floatingClassPlayer: string = '';
  
  floatingTextEnemy: string | null = null;
  floatingClassEnemy: string = '';

  editingIndex: number | null = null;
  manualId: number | null = null;
  highScores: any[] = [];
  pollingInterval: any;

  typeChart: any = {
    fire: { weak: ['water', 'ground', 'rock'], strong: ['grass', 'ice', 'bug'] },
    water: { weak: ['grass', 'electric'], strong: ['fire', 'ground', 'rock'] },
    grass: { weak: ['fire', 'ice', 'poison', 'flying', 'bug'], strong: ['water', 'ground', 'rock'] },
    electric: { weak: ['ground'], strong: ['water', 'flying'] },
    rock: { weak: ['water', 'grass', 'fighting', 'ground'], strong: ['fire', 'ice', 'flying', 'bug'] },
    ground: { weak: ['water', 'grass', 'ice'], strong: ['fire', 'electric', 'poison', 'rock'] },
    ice: { weak: ['fire', 'fighting', 'rock'], strong: ['grass', 'ground', 'flying', 'dragon'] },
    psychic: { weak: ['bug', 'ghost', 'dark'], strong: ['fighting', 'poison'] },
  };

  ngOnInit() {
    this.generateRandomTeam();
  }

  ngOnDestroy() {
    this.stopPolling();
    this.audio.stopMusic();
  }

  getPreviewImage(): string {
    if (!this.manualId) return 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${this.manualId}.png`;
  }

  getTypeColor(type: string): string {
    const colors: any = {
      fire: 'bg-red-600 text-white', water: 'bg-blue-500 text-white', grass: 'bg-green-600 text-white', electric: 'bg-yellow-500 text-black',
      psychic: 'bg-purple-600 text-white', ice: 'bg-cyan-400 text-black', dragon: 'bg-indigo-600 text-white', dark: 'bg-gray-800 text-white',
      fairy: 'bg-pink-400 text-black', normal: 'bg-gray-400 text-black', fighting: 'bg-orange-700 text-white', flying: 'bg-sky-400 text-black',
      poison: 'bg-fuchsia-700 text-white', ground: 'bg-yellow-700 text-white', rock: 'bg-stone-600 text-white', bug: 'bg-lime-500 text-black',
      ghost: 'bg-violet-800 text-white', steel: 'bg-slate-400 text-black'
    };
    return colors[type] || 'bg-gray-500 text-white';
  }

  generateRandomTeam() {
    this.pokeService.getTeam().subscribe(team => this.myTeam = team);
  }

  changePokemon(index: number) {
    if (!this.manualId) return;
    this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${this.manualId}`).pipe(
      map(response => ({
        id: response.id,
        name: response.name,
        image: response.sprites.other['official-artwork'].front_default,
        hp: response.stats[0].base_stat,
        maxHp: response.stats[0].base_stat,
        attack: response.stats[1].base_stat,
        defense: response.stats[2].base_stat,
        speed: response.stats[5].base_stat,
        type: response.types[0].type.name,
        moves: this.getRandomMoves(response.moves) // Cargamos movimientos también al editar
      }))
    ).subscribe({
      next: (newPoke) => {
        this.myTeam[index] = newPoke;
        this.editingIndex = null;
        this.manualId = null;
      },
      error: () => alert('Pokémon no encontrado')
    });
  }

  // Helper para movimientos al editar manualmente
  private getRandomMoves(allMoves: any[]): any[] {
    const shuffled = allMoves.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4).map((m: any) => ({
      name: m.move.name.replace(/-/g, ' '),
      url: m.move.url
    }));
  }

  async openLeaderboard() {
    this.highScores = await this.supabase.getLeaderboard() || [];
    this.view = 'LEADERBOARD';
  }

  toggleMusic() { this.audio.toggleMusic(); this.audio.playSound('click'); }

  // --- LOGICA DE SALIR CORREGIDA ---
  quitGame(force: boolean = false) {
    // Si es forzado (fin del juego) O el usuario confirma, salimos.
    if (force || confirm('¿Seguro que quieres rendirte y salir?')) {
      this.view = 'MENU';
      this.winner = null;
      this.roomCode = '';
      this.stopPolling();
      this.audio.stopMusic();
    }
  }

  playVsBot() {
    if (!this.playerName) return alert('¡Escribe tu nombre!');
    this.gameMode = 'VS_BOT'; this.myPlayerId = 'player1'; this.currentTurn = 'player1';
    this.pokeService.getTeam().subscribe(enemyTeam => {
      this.enemyTeam = enemyTeam; this.enemyPokemon = this.enemyTeam[0]; this.myPokemon = this.myTeam[0];
      this.view = 'BATTLE'; this.audio.playMusic();
      this.audio.speak('Iniciando batalla contra el CPU');
    });
  }

  async createGame() {
    if (!this.playerName) return alert('¡Escribe tu nombre!');
    this.gameMode = 'ONLINE';
    this.roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.myPlayerId = 'player1';
    await this.supabase.createRoom(this.roomCode, this.myTeam);
    this.view = 'LOBBY'; this.subscribeToRoom(); this.startPollingForRival();
  }

  async joinGame() {
    if (!this.roomCode || !this.playerName) return alert('Datos incompletos');
    this.gameMode = 'ONLINE'; this.myPlayerId = 'player2';
    const { data, error } = await this.supabase.joinRoom(this.roomCode, this.myTeam);
    if (error) return alert('Error al unirse.');
    this.ngZone.run(() => this.initBattleData(data));
    this.subscribeToRoom();
  }

  startPollingForRival() {
    this.pollingInterval = setInterval(async () => {
      if (this.view === 'BATTLE') { this.stopPolling(); return; }
      const roomData = await this.supabase.getRoom(this.roomCode);
      if (roomData && roomData.status === 'playing') {
        this.ngZone.run(() => this.initBattleData(roomData));
        this.stopPolling();
      }
    }, 2000);
  }
  stopPolling() { if (this.pollingInterval) clearInterval(this.pollingInterval); }

  subscribeToRoom() {
    this.supabase.listenToBattle(this.roomCode, (updatedRoom) => this.ngZone.run(() => this.initBattleData(updatedRoom)));
  }

  initBattleData(roomData: any) {
    this.currentTurn = roomData.current_turn || 'player1';
    if (roomData.status === 'playing' && this.view !== 'BATTLE') {
      this.view = 'BATTLE'; this.audio.playMusic(); this.stopPolling();
      this.audio.speak('Batalla en línea iniciada');
    }
    
    const prevHp = this.myPokemon?.hp || 0;

    if (this.myPlayerId === 'player1') {
      this.myTeam = roomData.player1_team; this.enemyTeam = roomData.player2_team;
    } else {
      this.myTeam = roomData.player2_team; this.enemyTeam = roomData.player1_team;
    }
    
    this.updateActivePokemon();

    if (this.myPokemon && this.myPokemon.hp < prevHp) {
        const dmg = prevHp - this.myPokemon.hp;
        let label = `-${dmg}`;
        let style = 'text-red-500';
        
        this.audio.speak(`El enemigo te ataca`);

        if (dmg > 30) { 
            label = `¡CRÍTICO! -${dmg}`; style = 'text-yellow-400 font-black text-6xl'; 
            setTimeout(() => this.audio.speak('¡Golpe crítico!'), 1500);
        }
        this.triggerReceivedDamage(label, style);
    }
    this.checkWinner(roomData.status);
  }

  calculateComplexDamage(attacker: Pokemon, defender: Pokemon): { damage: number, msg: string, style: string } {
    let multiplier = 1; let msg = ''; let style = 'text-white';
    if (this.typeChart[attacker.type]) {
      if (this.typeChart[attacker.type].strong.includes(defender.type)) {
        multiplier = 2; msg = '¡SÚPER EFECTIVO!'; style = 'text-yellow-400 font-black text-6xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]';
      } else if (this.typeChart[attacker.type].weak.includes(defender.type)) {
        multiplier = 0.5; msg = 'No es muy efectivo...'; style = 'text-gray-400 text-3xl';
      }
    }
    const isCrit = Math.random() < 0.15;
    if (isCrit) { multiplier *= 1.5; msg = msg ? `${msg} (CRÍTICO)` : '¡GOLPE CRÍTICO!'; style = 'text-red-500 font-black text-6xl drop-shadow-[0_0_10px_rgba(220,38,38,0.8)]'; }
    const baseDamage = Math.floor(Math.random() * 15) + 10;
    const totalDamage = Math.floor(baseDamage * multiplier);
    return { damage: totalDamage, msg, style };
  }

  attack(moveName: string) {
    if (this.currentTurn !== this.myPlayerId || this.winner) return;

    this.audio.playSound('attack');
    this.animatingAttack = true; 
    setTimeout(() => this.animatingAttack = false, 300);

    const combatResult = this.calculateComplexDamage(this.myPokemon!, this.enemyPokemon!);
    this.audio.speak(`${this.myPokemon?.name} usa ${moveName}`);

    if (this.enemyPokemon) {
        this.enemyPokemon.hp -= combatResult.damage;
        if (this.enemyPokemon.hp < 0) this.enemyPokemon.hp = 0;
        this.animatingDamage = true;
        const displayText = combatResult.msg ? combatResult.msg : `-${combatResult.damage}`;
        this.showFloatingText('enemy', displayText, combatResult.style);
        setTimeout(() => this.animatingDamage = false, 500);
    }

    const logMsg = combatResult.msg 
      ? `${this.playerName} usó ${moveName.toUpperCase()}: ${combatResult.msg} (-${combatResult.damage})` 
      : `${this.playerName} usó ${moveName.toUpperCase()}: -${combatResult.damage} HP`;
    this.battleLog.unshift(logMsg);

    if (this.enemyPokemon && this.enemyPokemon.hp <= 0) {
       this.battleLog.unshift(`💀 ¡${this.enemyPokemon.name} cayó!`);
       this.audio.playSound('hit');
    }

    if (this.gameMode === 'ONLINE') this.sendOnlineUpdate();
    else {
        this.checkLocalWinner();
        if (!this.winner) {
            this.currentTurn = 'cpu';
            setTimeout(() => this.botTurn(), 1500);
        }
    }
  }

  botTurn() {
    if (this.winner) return;
    const combatResult = this.calculateComplexDamage(this.enemyPokemon!, this.myPokemon!);
    const randomMove = this.enemyPokemon?.moves && this.enemyPokemon.moves.length > 0 
      ? this.enemyPokemon.moves[Math.floor(Math.random() * this.enemyPokemon.moves.length)].name 
      : 'Ataque';

    this.audio.speak(`${this.enemyPokemon?.name} usa ${randomMove}`);

    if (this.myPokemon) {
        this.myPokemon.hp -= combatResult.damage;
        if (this.myPokemon.hp < 0) this.myPokemon.hp = 0;
        const displayText = combatResult.msg ? combatResult.msg : `-${combatResult.damage}`;
        this.triggerReceivedDamage(displayText, combatResult.style);
    }
    
    this.battleLog.unshift(`🤖 BOT usó ${randomMove.toUpperCase()}: (-${combatResult.damage})`);
    this.checkLocalWinner();
    if (!this.winner) this.currentTurn = 'player1';
  }

  async sendOnlineUpdate() {
    const nextTurn = this.myPlayerId === 'player1' ? 'player2' : 'player1';
    let p1Data = this.myPlayerId === 'player1' ? this.myTeam : this.enemyTeam;
    let p2Data = this.myPlayerId === 'player1' ? this.enemyTeam : this.myTeam;
    const enemyAlive = this.enemyTeam.some(p => p.hp > 0);
    const newStatus = enemyAlive ? 'playing' : 'finished';
    try {
      await this.supabase.sendUpdate(this.roomCode, p1Data, p2Data, nextTurn, newStatus === 'finished' ? 'finished' : null);
    } catch (e) { console.error(e); }
  }

  updateActivePokemon() {
    this.myPokemon = this.myTeam.find(p => p.hp > 0) || null;
    this.enemyPokemon = this.enemyTeam.find(p => p.hp > 0) || null;
  }

  triggerReceivedDamage(text: string, styleClass: string) {
    this.audio.playSound('hit');
    this.playerDamaged = true;
    this.showFloatingText('player', text, styleClass);
    setTimeout(() => this.playerDamaged = false, 500);
  }

  showFloatingText(target: 'player' | 'enemy', text: string, styleClass: string) {
    if (target === 'player') {
        this.floatingTextPlayer = text;
        this.floatingClassPlayer = styleClass;
    } else {
        this.floatingTextEnemy = text;
        this.floatingClassEnemy = styleClass;
    }
    setTimeout(() => {
      this.floatingTextPlayer = null;
      this.floatingTextEnemy = null;
    }, 1500);
  }

  checkWinner(status: string) {
    if (status === 'finished' && !this.winner) {
       this.audio.stopMusic();
       if (!this.myPokemon) { 
           this.winner = 'DERROTA'; 
           this.audio.playSound('hit');
           this.audio.speak('Has perdido la batalla');
       } else if (!this.enemyPokemon) { 
           this.winner = 'VICTORIA'; 
           this.audio.playSound('win'); 
           this.saveScore(); 
           this.launchConfetti();
           this.audio.speak('¡Victoria! Eres un maestro Pokémon');
       }
    }
  }

  checkLocalWinner() {
    this.updateActivePokemon();
    if (!this.myPokemon) { 
        this.audio.stopMusic(); 
        this.winner = 'DERROTA'; 
        this.audio.playSound('hit'); 
        this.audio.speak('Has perdido'); 
    } else if (!this.enemyPokemon) { 
        this.audio.stopMusic(); 
        this.winner = 'VICTORIA'; 
        this.audio.playSound('win'); 
        this.saveScore(); 
        this.launchConfetti(); 
        this.audio.speak('¡Ganaste!'); 
    }
  }

  async saveScore() {
    await this.supabase.saveScore(this.playerName + (this.gameMode === 'VS_BOT' ? ' (Bot)' : ''));
  }

  launchConfetti() {
    const duration = 3000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#EF4444', '#3B82F6', '#EAB308'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#EF4444', '#3B82F6', '#EAB308'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  }
}