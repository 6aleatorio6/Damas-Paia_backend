import { createMatch } from 'test/wsHelper';

describe('match (Ws)', () => {
  describe('Turnos', () => {
    test('Deve permitir que o jogador 2 jogue após o jogador 1', async () => {
      const { client1, client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      const piece = pieces.find((p) => p.player === 'player1' && p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 2, y: 3 } });

      const [turn] = await client2.onPaia('match:status');
      expect(turn === 'player2');

      const piece2 = pieces.find((p) => p.player === 'player2' && p.y === 5 && p.x === 0);
      client2.emit('match:move', { id: piece2.id, to: { x: 1, y: 4 } });

      const [turn2] = await client2.onPaia('match:status');
      expect(turn2 === 'player1');
    });

    test('Deve impedir que o jogador jogue fora de seu turno', async () => {
      const { client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      const piece = pieces.find((p) => p.player === 'player2');
      client2.emit('match:paths', piece.id);

      const [res] = await client2.onPaia('error');
      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Não é seu turno',
        statusCode: 400,
      });
    });
  });

  describe('Contador de peças', () => {
    test('Deve retornar o número de peças de cada jogador', async () => {
      const { client1, client2, matC2 } = await createMatch();
      const [match, pieces] = matC2;

      const piece1 = pieces.find((p) => p.x === 5 && p.y === 2);
      const piece2 = pieces.find((p) => p.x === 2 && p.y === 5);

      client1.emit('match:move', { id: piece1.id, to: { x: 4, y: 3 } });
      const [, lenght1P] = await client1.onPaia('match:status');
      expect(lenght1P).toEqual({ player1: 12, player2: 12 });

      client2.emit('match:move', { id: piece2.id, to: { x: 3, y: 4 } });
      const [, lenght2P] = await client1.onPaia('match:status');
      expect(lenght2P).toEqual({ player1: 12, player2: 12 });

      client1.emit('match:move', { id: piece1.id, to: { x: 2, y: 5 } });
      const [, lenght3P] = await client1.onPaia('match:status');
      expect(lenght3P).toEqual({ player1: 12, player2: 11 });
    });
  });
});
