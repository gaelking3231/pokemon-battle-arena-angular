import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  // MÚSICA DE FONDO (Link estable de Showdown)
  private bgMusic = new Audio('https://play.pokemonshowdown.com/audio/xy-trainer.mp3'); 
  
  private sounds: any = {
    start: 'https://play.pokemonshowdown.com/audio/cries/pikachu.mp3', 
    attack: 'https://rpg.hamsterrepublic.com/wiki-images/d/db/Crush8-Bit.ogg',
    hit: 'https://rpg.hamsterrepublic.com/wiki-images/7/72/Metal_Hit.ogg',
    win: 'https://play.pokemonshowdown.com/audio/cries/charizard-megay.mp3',
    click: 'https://rpg.hamsterrepublic.com/wiki-images/2/21/Collision8-Bit.ogg'
  };

  constructor() {
    this.bgMusic.loop = true; 
    this.bgMusic.volume = 0.4; // Volumen perfecto para que se escuche la voz encima
    this.bgMusic.load();
  }

  // --- NUEVO: NARRADOR (TEXT-TO-SPEECH) ---
  speak(text: string) {
    if ('speechSynthesis' in window) {
      // Cancelamos si ya estaba hablando para no empalmar frases
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-MX'; // Español Latino
      utterance.rate = 1.1;     // Velocidad ligeramente rápida (Emoción)
      utterance.pitch = 1.0;
      utterance.volume = 1.0;   // Voz fuerte
      
      window.speechSynthesis.speak(utterance);
    }
  }

  playMusic() {
    this.bgMusic.currentTime = 0;
    this.bgMusic.play().catch(e => console.warn('Audio bloqueado, usa el botón'));
  }

  toggleMusic() {
    if (this.bgMusic.paused) {
      this.bgMusic.play().catch(e => console.error(e));
    } else {
      this.bgMusic.pause();
    }
  }

  stopMusic() {
    this.bgMusic.pause();
    this.bgMusic.currentTime = 0;
  }

  playSound(effect: string) {
    const audio = new Audio(this.sounds[effect]);
    audio.volume = 0.6;
    audio.play().catch(e => console.error(e));
  }
}