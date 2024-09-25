import { createMatch } from 'test/wsHelper';

describe('match-piece (Ws)', () => {
  describe('match:paths ', () => {
    test('Deve retornar BadRequest ao tentar ver os caminhos fora do turno', async () => {
      const { client2 } = await createMatch();

      client2.emit('match:paths', 1);
      const [res] = await client2.onPaia('error');

      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Não é seu turno',
        statusCode: 400,
      });
    });

    test('Deve retornar BadRequest ao tentar ver os caminhos de uma peça que não é sua', async () => {
      const { client1, matC1 } = await createMatch();
      const [, pieces] = matC1;

      const invalidPieceId = pieces.find((p) => p.player !== 'player1').id;
      client1.emit('match:paths', invalidPieceId);
      const [error] = await client1.onPaia('error');

      expect(error).toMatchObject({
        error: 'Bad Request',
        message: 'A peça não é sua',
        statusCode: 400,
      });
    });

    test('Deve retornar os caminhos válidos para uma peça do player 1', async () => {
      const { client1, matC1 } = await createMatch();
      const [, pieces] = matC1;

      const piece = pieces.find((p) => p.y === 2 && p.x === 1);
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
      const [, pieces] = matC1;

      const piece = pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 0, y: 3 } });

      const [res] = await client1.onPaia('match:update');

      expect(res).toEqual({
        chainOfMotion: [{ x: 0, y: 3 }],
        isQueen: false,
        pieceId: piece.id,
        piecesDeads: [],
      });
    });

    test('Deve mover uma peça comum do player 1 corretamente para upRight', async () => {
      const { client1, matC1 } = await createMatch();
      const [, pieces] = matC1;

      const piece = pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 2, y: 3 } });

      const [res] = await client1.onPaia('match:update');

      expect(res).toMatchObject({
        chainOfMotion: [{ x: 2, y: 3 }],
        isQueen: false,
        pieceId: piece.id,
        piecesDeads: [],
      });
    });

    test('Deve impedir movimento inválido e retornar erro', async () => {
      const { client1, matC1 } = await createMatch();
      const [, pieces] = matC1;

      const piece = pieces.find((p) => p.y === 2 && p.x === 1);
      client1.emit('match:move', { id: piece.id, to: { x: 0, y: 1 } });

      const [res] = await client1.onPaia('error');

      expect(res).toMatchObject({
        error: 'Bad Request',
        message: 'Movimento inválido',
        statusCode: 400,
      });
    });
  });
});
