import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GameService {
  public multiplier = 1.0;
  public isRunning = false;
  private crashPoint = 0;
  private gameLoopInterval: NodeJS.Timeout | null = null;

  // Inicia o ciclo de preparação (5 segundos de aposta)
  startRound(server: Server) {
    console.log('⏳ Preparando próxima rodada...');
    let countdown = 5; // 5 Segundos de espera

    // Envia evento de espera inicial
    server.emit('game-waiting', { countdown });

    const countdownInterval = setInterval(() => {
      countdown--;
      server.emit('game-waiting', { countdown });

      if (countdown <= 0) {
        clearInterval(countdownInterval);
        this.startGame(server); // Começa o voo de verdade
      }
    }, 1000);
  }

  // O Voo em si
  startGame(server: Server) {
    this.isRunning = true;
    this.multiplier = 1.0;
    
    // Crash point aleatório (Simples)
    this.crashPoint = parseFloat((Math.random() * 10 + 1).toFixed(2));
    if (Math.random() > 0.9) this.crashPoint = 1.00; // 10% de chance de crashar na decolagem (Azar!)

    console.log(`🚀 Decolando! Crash em: ${this.crashPoint}x`);
    server.emit('game-start', { multiplier: 1.0 });

    this.gameLoopInterval = setInterval(() => {
      // Curva exponencial: Sobe devagar e depois acelera
      this.multiplier += 0.01 + (this.multiplier * 0.008); 

      if (this.multiplier >= this.crashPoint) {
        this.crashGame(server);
      } else {
        server.emit('multiplier-update', this.multiplier);
      }
    }, 100);
  }

  crashGame(server: Server) {
    if (this.gameLoopInterval) clearInterval(this.gameLoopInterval);
    
    this.isRunning = false;
    // Garante que o valor final seja o do crash
    const finalCrash = this.multiplier < this.crashPoint ? this.crashPoint : this.multiplier;
    
    console.log(`💥 CRASHOU em ${finalCrash.toFixed(2)}x!`);
    server.emit('game-crash', { crashPoint: finalCrash.toFixed(2) });

    // Reinicia o ciclo após 2 segundos (tempo de ver a explosão)
    setTimeout(() => {
      this.startRound(server);
    }, 2000);
  }
}