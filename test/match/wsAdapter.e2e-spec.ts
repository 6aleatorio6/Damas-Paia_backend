import { createClient } from 'test/wsHelper';

describe('IoAdapterAuth (ws) ', () => {
  test('conectando com token valido', async () => {
    const client = await createClient();

    return client.onPaia('connect');
  });

  test('conectando sem token', async () => {
    const client = await createClient(null);

    const error = await client.onPaia('connect_error', (e) =>
      JSON.parse(e.context.responseText),
    );

    expect(error.message).toBe('INVALID');
  });

  test('conectando com token invalido', async () => {
    const client = await createClient('Bearer tokenInvalido');

    const error = await client.onPaia('connect_error', (e) =>
      JSON.parse(e.context.responseText),
    );

    expect(error.message).toBe('INVALID');
  });

  test('conectando com token invalido', async () => {
    const client = await createClient('Bearer tokenInvalido');

    const error = await client.onPaia('connect_error', (e) =>
      JSON.parse(e.context.responseText),
    );

    expect(error.message).toBe('INVALID');
  });
});
