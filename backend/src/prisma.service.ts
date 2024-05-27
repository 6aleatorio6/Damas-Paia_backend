import {
  Global,
  HttpException,
  Injectable,
  Module,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
    return prismaPaiado(this) as this;
  }

  async onModuleInit() {
    await this.$connect();
  }
}

export const prismaPaiado = Prisma.defineExtension({
  query: {
    async $allOperations({ args, query }) {
      try {
        return await query(args);
      } catch (e) {
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          const sabedoriaSabia = errosSabidos(e.meta)[
            e.code as keyof ReturnType<typeof errosSabidos>
          ];

          if (!sabedoriaSabia)
            throw new HttpException('erro desconhecido do prisma', 500);

          throw new HttpException(sabedoriaSabia[1], sabedoriaSabia[0]);
        }
        throw e;
      }
    },
  },
});

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModuleGlobal {}

const errosSabidos = (metaError: MetaError) => {
  const { modelName: model, target } = metaError;

  const col = target ? target.split('_')[1] : model;
  return {
    P2000: [400, `Valor muito longo para este campo.`],
    P2001: [404, `${model} não encontrado.`],
    P2002: [400, `Esse ${col} já existe.`],
    P2003: [400, `Chave estrangeira inválida.`],
    P2004: [400, `Restrição falhou no banco de dados.`],
    P2005: [400, `Valor inválido para este campo.`],
    P2006: [400, `Valor fornecido é inválido.`],
    P2007: [400, `Erro de validação de dados.`],
    P2008: [400, `Erro ao analisar a consulta.`],
    P2009: [400, `Erro ao validar a consulta.`],
    P2010: [400, `Consulta bruta falhou.`],
    P2011: [400, `Valor não pode ser nulo.`],
    P2012: [400, `Valor obrigatório está faltando.`],
    P2013: [400, `Argumento obrigatório está faltando.`],
    P2014: [400, `Ação viola uma relação necessária.`],
    P2015: [400, `${model} não encontrado.`],
    P2016: [400, `Erro na interpretação da consulta.`],
    P2017: [400, `${model}s não estão conectados.`],
    P2018: [400, `${model}s conectados estão faltando.`],
    P2019: [400, `Erro de entrada.`],
    P2020: [400, `Valor fora do intervalo.`],
    P2021: [404, `Tabela não encontrada.`],
    P2022: [404, `Coluna não encontrada.`],
    P2023: [400, `Dados inconsistentes na coluna.`],
    P2024: [503, `Tempo   ao buscar uma nova conexão.`],
    P2025: [400, `o ${model} não existe.`],
    P2026: [400, `Recurso não suportado pelo banco de dados.`],
    P2027: [400, `Vários erros durante a execução da consulta.`],
    P2028: [400, `Erro na API de transação.`],
    P2029: [400, `Limite de parâmetros da consulta excedido.`],
    P2030: [400, `Índice de texto completo não encontrado.`],
    P2033: [400, `Número muito grande para este campo.`],
    P2034: [400, `Falha na transação devido a conflito ou impasse.`],
    P2035: [400, `Violação de asserção no banco de dados.`],
    P2036: [400, `Erro no conector externo.`],
    P2037: [400, `Muitas conexões de banco de dados abertas.`],
  } as const;
};

interface MetaError {
  modelName?: string;
  target?: string;
}
