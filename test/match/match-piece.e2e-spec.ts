import { MatchPaiado } from 'src/match/match';
import { createClient, wsTestAll } from 'test/wsHelper';

async function createMatch() {
  const client1 = await createClient();
  const client2 = await createClient();

  client1.emit('match:queue', 'join');
  client2.emit('match:queue', 'join');

  const [matC1, matC2] = (await Promise.all([
    client1.onPaia('match:start'),
    client2.onPaia('match:start'),
  ])) as MatchPaiado[];

  return { client1, client2, matC1, matC2 };
}

describe('match-piece (Ws)', () => {
  wsTestAll();

  describe('match:paths ', () => {
    test('Deve retornar BadRequest ao tentar ver os caminhos fora do turno', async () => {
      const { client2 } = await createMatch();

      client2.emit('match:paths', 1);
      const res = await client2.onPaia('error');

      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Não é seu turno',
        statusCode: 400,
      });
    });

    test('Deve retornar BadRequest ao tentar ver os caminhos de uma peça que não é sua', async () => {
      const { client1, matC1 } = await createMatch();

      const invalidPieceId = matC1.playerOponent.pieces[0].id;
      client1.emit('match:paths', invalidPieceId);
      const res = await client1.onPaia('error');

      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Peça não é sua',
        statusCode: 400,
      });
    });

    test('Deve retornar os caminhos válidos para uma peça do player 1', async () => {
      const { client1, matC1 } = await createMatch();

      const piece = matC1.myPlayer.pieces.find((p) => p.y === 2 && p.x === 1);
      const res = await client1.emitWithAck('match:paths', piece.id);

      expect(res).toEqual(
        expect.arrayContaining([
          { x: 0, y: 3 },
          { x: 2, y: 3 },
        ]),
      );
    });
  });

  describe('match:move e match:update', () => {
    test('Deve mover uma peça comum do player 1 corretamente para upLeft', async () => {
      const { client1, matC1 } = await createMatch();

      const piece = matC1.myPlayer.pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 0, y: 3 } });

      const res = await client1.onPaia('match:update');

      expect(res).toMatchObject({
        deads: [],
        piece: {
          id: piece.id,
          movs: [{ x: 0, y: 3 }],
        },
      });
    });

    test('Deve mover uma peça comum do player 1 corretamente para upRight', async () => {
      const { client1, matC1 } = await createMatch();

      const piece = matC1.myPlayer.pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 2, y: 3 } });

      const res = await client1.onPaia('match:update');

      expect(res).toMatchObject({
        deads: [],
        piece: {
          id: piece.id,
          movs: [{ x: 2, y: 3 }],
        },
      });
    });

    test('Deve impedir movimento inválido e retornar erro', async () => {
      const { client1, matC1 } = await createMatch();

      const piece = matC1.myPlayer.pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 0, y: 1 } }); // Movimento inválido

      const res = await client1.onPaia('error');
      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Movimento inválido',
        statusCode: 400,
      });
    });

    test.skip('Deve processar múltiplos movimentos e atualizar corretamente', async () => {
      const { client1, matC1, client2, matC2 } = await createMatch();

      const piece1 = matC1.myPlayer.pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece1.id, to: { x: 2, y: 3 } });
      await client1.onPaia('match:update');

      const piece2 = matC2.myPlayer.pieces.find((p) => p.y === 5 && p.x === 6);
      client2.emit('match:move', { id: piece2.id, to: { x: 4, y: 5 } });
      const res2 = await client2.onPaia('match:update');

      expect(res2).toHaveProperty('movs', [
        { id: piece2.id, to: { x: 4, y: 5 } },
      ]);

      // Confirma o estado de ambos os jogadores
      const updatedPiece1 = matC1.myPlayer.pieces.find(
        (p) => p.id === piece1.id,
      );
      const updatedPiece2 = matC2.myPlayer.pieces.find(
        (p) => p.id === piece2.id,
      );

      expect(updatedPiece1).toMatchObject({ x: 2, y: 3 });
      expect(updatedPiece2).toMatchObject({ x: 4, y: 5 });
    });
  });
});
