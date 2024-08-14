<p align="center" >
  <a href="http://nestjs.com/" target="blank"><img src="https://raw.githubusercontent.com/6aleatorio6/Damas-Paia_mobile/main/src/assets/icon.png" width="200" alt="DAMASPAIA Logo" /></a>
</p>

<p>
    <p align="center">Jogo de Damas online multiplataforma em desenvolvimento</p>
</p>

## Descrição

Este é o repositório do backend do DamasPaia, um jogo de damas online desenvolvido com NestJS, TypeORM e PostgreSQL. O projeto busca oferecer uma cobertura de testes robusta no backend.

| Plataforma                                                   | Tecnologia   | Status       |
| ------------------------------------------------------------ | ------------ | ------------ |
| [Backend](https://github.com/6aleatorio6/Damas-Paia_backend) | NestJS       | Em andamento |
| [Mobile](https://github.com/6aleatorio6/Damas-Paia_mobile)   | React Native | Em andamento |
| Web                                                          | React        | Não iniciado |
| Desktop                                                      | Não definido | Não iniciado |

### Funcionalidades do Backend

- [x] Cadastro de usuário
- [x] Autenticação via username e password com retorno de token JWT
- [x] Manipulação de usuário (obter, editar, excluir) através de rotas protegidas por token
- [x] Revalidação de token expirado
- [x] Implementação de conexões WebSocket protegidas por tokens
- [x] Fila de pareamento de jogadores para criação de partida
- [ ] Lógica de movimentação das peças no tabuleiro
- [ ] Lógica de finalização de partidas
- [ ] Autenticação OAuth2 (Google, Discord, GitHub)
- [ ] Outras funcionalidades planejadas

## Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/6aleatorio6/Damas-Paia_backend.git
   ```

2. Acesse o diretório do projeto:

   ```bash
   cd Damas-Paia_backend
   ```

3. Crie um arquivo `.env` usando o `.env.example` como base:

   ```bash
   cp .env.example .env
   ```

## Executando a Aplicação

Para iniciar a aplicação com Docker Compose, utilize o seguinte comando:

```bash
 npm run compose:dev
```

### Testes

Para executar os testes da aplicação, utilize os comandos abaixo:

- **Testes unitários:**

  ```bash
  npm run compose test
  ```

- **Testes de ponta a ponta (E2E):**

  ```bash
  npm run compose test:e2e
  ```

- **Modo watch:** (para executar testes automaticamente ao detectar mudanças)

  ```bash
  npm run compose test:e2e -- --watch <pattern>
  npm run compose test -- --watch <pattern>
  ```

## Criador

- **Autor:** Leonardo L. Felix
  - **Email:** [leonardolfelix12@gmail.com](mailto:leonardolfelix12@gmail.com)
  - **GitHub:** [6aleatorio6](https://www.github.com/6aleatorio6)
