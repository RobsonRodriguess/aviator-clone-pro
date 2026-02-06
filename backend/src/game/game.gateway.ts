import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer() server: Server;

  // Guarda as apostas ativas: ID do Socket -> Valor em dinheiro
  private activeBets = new Map<string, number>();

  constructor(private readonly gameService: GameService) {}

  afterInit(server: Server) {
    console.log('✅ WebSocket Inicializado!');
    this.gameService.startGame(this.server); 
  }

  handleConnection(client: Socket) {
    // Cliente conectou (silencioso)
  }

  handleDisconnect(client: Socket) {
    // Se o cliente desconectar, removemos a aposta dele para não bugar
    this.activeBets.delete(client.id);
  }

  // RECEBE A APOSTA (Quando começa o jogo)
  @SubscribeMessage('place-bet')
  handleBet(client: Socket, payload: { amount: number }) {
    if (!payload || !payload.amount) return;

    // Registra na memória que esse cliente apostou X
    this.activeBets.set(client.id, payload.amount);
    console.log(`💰 Aposta recebida de ${client.id.substr(0,4)}: R$ ${payload.amount}`);
  }

  // RECEBE O PEDIDO DE SAQUE (CASHOUT)
  @SubscribeMessage('cashout')
  handleCashout(client: Socket) {
    const betAmount = this.activeBets.get(client.id);

    // Verificações de segurança
    if (!betAmount) return; // Cliente não tinha aposta registrada
    if (!this.gameService.isRunning) return; // Jogo já tinha acabado

    // Calcula o ganho
    const currentMultiplier = this.gameService.multiplier;
    const winAmount = parseFloat((betAmount * currentMultiplier).toFixed(2));

    // Remove a aposta da memória (para ele não sacar duas vezes)
    this.activeBets.delete(client.id);

    // Envia o dinheiro e a confirmação pro cliente
    client.emit('bet-win', { winAmount, multiplier: currentMultiplier });
    
    console.log(`🤑 CASHOUT! ${client.id.substr(0,4)} sacou R$ ${winAmount} (${currentMultiplier}x)`);
  }
}