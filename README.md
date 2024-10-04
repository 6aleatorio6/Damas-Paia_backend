<p align="center" >
  <a href="#" target="blank"><img src="https://raw.githubusercontent.com/6aleatorio6/Damas-Paia_mobile/main/src/assets/icon.png" width="200" alt="DAMASPAIA Logo" /></a>
</p>

<p>
    <p align="center">Jogo de Damas online multiplataforma</p>
</p>

## Descrição

Este é o repositório do backend do projeto **DamasPaia**, um jogo de damas online desenvolvido com **NestJS**, **TypeORM**, **Socket.io** e **PostgreSQL**. O projeto possui uma cobertura robusta de testes, tanto unitários quanto end-to-end.

| Plataforma                                                   | Tecnologia   | Status       |
| ------------------------------------------------------------ | ------------ | ------------ |
| [Backend](https://github.com/6aleatorio6/Damas-Paia_backend) | NestJS       | Em andamento |
| [Mobile](https://github.com/6aleatorio6/Damas-Paia_mobile)   | React Native | Em andamento |
| Web                                                          | React        | Não iniciado |


## Funcionalidades

### Segurança

- **Autenticação de Usuário:** Realiza autenticação via nome e senha, fornecendo um token JWT.
- **Revalidação de Token:** Garante a revalidação de tokens expirados.
- **Autenticação OAuth2:** Integração com provedores OAuth2 como Google, Discord e GitHub, permitindo que os usuários criem contas diretamente por esses provedores.
- **Conexões WebSocket Protegidas:** Implementa conexões WebSocket seguras utilizando tokens.
- **Desconfiança com o Frontend:** O backend utiliza o UUID do token para identificar o usuário, inclusive nas conexões WebSocket.
- 
### Usuário

- **Cadastro de Usuário:** Permite criar um novo usuário no sistema.
- **Verificação de Usuário:** Verifica se o nome de usuário ou email já existe.
- **Manipulação de Usuário:** Rotas protegidas por token para obter, editar e excluir usuários.

### Jogo

- **Fila de Pareamento**: Gerencia a fila de jogadores que desejam criar uma partida, organizando os pareamentos de forma automática.

- **Requisição de Caminhos Disponíveis**: O frontend pode solicitar ao backend os caminhos que uma peça pode se mover, facilitando a exibição dos movimentos permitidos na interface.

- **Movimentação das Peças**: As peças podem ser movidas ao longo do tabuleiro se o movimento for válido; quaisquer efeitos, como captura e promoção para dama, são feitos automaticamente.

- **Gerenciamento de Turnos**: Controla a alternância de turnos entre os jogadores, garantindo que cada jogador realize sua jogada apenas na sua vez.

- **Ranking de Partidas**: Implementa um sistema de classificação dos jogadores com base em suas performances em partidas anteriores, permitindo comparar habilidades e desempenho.

- **Histórico de Partidas**: Os jogadores podem acessar um registro detalhado de todas as suas partidas jogadas anteriormente, incluindo resultados, datas e adversários.

- **Finalização de Partida Automática**: A partida termina automaticamente quando um jogador fica sem peças no tabuleiro.

- **Finalização de Partida por Desistência**: A partida também pode ser finalizada por desistência de um jogador, resultando em sua derrota.

- **Finalização de Partida por Desconexão**: A partida pode ser finalizada se um jogador se desconectar por um período maior que o definido em `TIMEOUT_TO_RECONNECT`, sendo declarado perdedor. Se uma partida permanecer em aberto com jogadores desconectados (pode acontecer quando o backend é desligado abruptamente), o frontend pode chamar o endpoint `match/check-and-finish` para forçar a finalização.



#### Regras do Jogo

- **Peças**: Cada jogador inicia com 12 peças distribuídas nas primeiras três linhas do tabuleiro.

- **Movimentação**: As peças comuns se movem uma casa por vez na diagonal, para frente. As damas podem se mover quantas casas desejar ao longo das diagonais.

- **Promoção para Damas**: Quando uma peça comum alcança a extremidade oposta do tabuleiro, ela se torna uma dama. As damas possuem a habilidade de se mover e capturar em qualquer direção ao longo das diagonais.

- **Captura de Peças**: As peças comuns e damas podem capturar peças adversárias. A captura é realizada quando um movimento salta por cima de uma peça inimiga, removendo-a do tabuleiro.

- **Captura para Trás**: Capturas para trás são permitidas para ambas as peças, comuns e damas.

- **Opcionalidade da Captura**: A captura não é obrigatória; o jogador é livre para executar qualquer movimento disponível, mesmo que não envolva capturas.

- **Capturas em Cadeia**: Capturas em cadeia são permitidas, possibilitando que uma única peça capture múltiplas peças adversárias em sequência, incluindo mudanças de direção.

- **Movimentação da Dama Após Captura**: Após realizar uma captura, seja ela normal ou em cadeia, a dama deve se mover para a casa vazia que fica imediatamente após a última peça capturada

- **Condição de Vitória**: Um jogador vence a partida quando captura todas as peças adversárias ou quando o oponente desiste.



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

### Testes Unitários

Atualmente, a aplicação possui **44 testes unitários**. Para executá-los, utilize o seguinte comando:

```bash
npm run compose test
```

### Testes E2E

A aplicação conta com **54 testes end-to-end**. Para executá-los, utilize o seguinte comando:

```bash
npm run compose test:e2e
```

### Modo Watch

Para executar os testes automaticamente sempre que houver mudanças nos arquivos, utilize o modo watch. O comando a seguir permite que você especifique um padrão para os arquivos que deseja observar:

```bash
npm run compose test:e2e -- --watch <pattern>
npm run compose test -- --watch <pattern>
```

Substitua <pattern> pelo caminho ou padrão de arquivos que deseja monitorar.

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
