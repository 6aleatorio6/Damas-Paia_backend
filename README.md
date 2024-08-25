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

## Funcionalidades do Backend

- [x] **Cadastro de Usuário:** Permite o registro de novos usuários no sistema.
- [x] **Autenticação de Usuário:** Realiza autenticação via nome e senha, fornecendo um token JWT.
- [x] **Manipulação de Usuário:** Rotas protegidas por token para obter, editar e excluir usuários.
- [x] **Revalidação de Token:** Garante a revalidação de tokens expirados.
- [x] **Conexões WebSocket Protegidas:** Implementa conexões WebSocket seguras com tokens.
- [x] **Fila de Pareamento:** Gerencia a fila de jogadores para criação de partidas.
- [x] **Exibição de Caminhos Disponíveis:** Mostra os caminhos disponíveis para as peças no tabuleiro.
- [x] **Movimentação das Peças:** Permite a movimentação das peças no tabuleiro.
- [x] **Validação dos Movimentos:** Valida os movimentos das peças de acordo com as regras do jogo.
- [x] **Gerenciamento de Turnos:** Controle dos turnos dos jogadores durante a partida.
- [ ] **Lógica de Finalização de Partidas:** Implementará a lógica para determinar e gerenciar o término de uma partida.
- [ ] **Autenticação OAuth2:** Planejada integração com Google, Discord e GitHub.
- [ ] **Outras Funcionalidades Planejadas:** Outras funcionalidades ainda estão em desenvolvimento.

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

## Testes

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

## Teste o Jogo de Damas com `demo.html`

 O `demo.html` serve como um frontend simples para testar o jogo de damas. Conseguindo testar as seguintes partes:
 
- **Criação de Usuário**: Permite criar um novo usuário e conectar ao servidor.
- **Pareamento**: Coloca o usuario criado na fila de pareamento.
- **Simulação de Partida**: Abra duas abas para simular uma partida completa.

![demonstração do html](demo.gif)

### Para simular uma partida:
 O backend deve estar em execução em `localhost:3000`.

1. **Abra o Arquivo**:
   Use duas abas ou janelas diferentes do navegador para abrir `demo.html`.

2. **Crie e Conecte Usuários**:
   O formulário é preenchido automaticamente com valores aleatórios. Clique em **Criar Usuario** em ambas as abas para conectar dois jogadores.

3. **Inicie a Partida**:
   A partida começará automaticamente após ambos os jogadores se conectarem.




## Criador

- **Autor:** Leonardo L. Felix
  - **Email:** [leonardolfelix12@gmail.com](mailto:leonardolfelix12@gmail.com)
  - **GitHub:** [6aleatorio6](https://www.github.com/6aleatorio6)
