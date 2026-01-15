import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Venda } from "../entities/Venda.js";
import { VendaItem } from "../entities/VendaItem.js";

export class ReportController {

    // Relatório detalhado com paginação
    static async loadReports(req: Request, res: Response) {
        const restId = (req as any).usuarioRestauranteId;

        // pega a pagina e o limite da url
        const pag = Number(req.query['pagina']) || 1;
        const lim = Number(req.query['limite']) || 10;
        const pular = (pag - 1) * lim;

        const repo = AppDataSource.getRepository(Venda);

        try {
            // busca as vendas e conta o total pra paginacao
            const [vendas, total] = await repo.findAndCount({
                where: { restauranteId: restId },
                relations: ["items"],
                order: { data: "DESC" },
                skip: pular,
                take: lim
            });

            // faz os calculos de soma pro resumo
            const stats = await repo.createQueryBuilder("venda")
                .where("venda.restauranteId = :restId", { restId })
                .select("SUM(venda.totalValor)", "totalVendas")
                .addSelect("SUM(venda.totalLucro)", "totalLucro")
                .addSelect("COUNT(venda.id)", "qtdVendas")
                .getRawOne();

            return res.json({
                resumo: {
                    receitaTotal: Number(stats.totalVendas || 0),
                    lucroTotal: Number(stats.totalLucro || 0),
                    quantidadeVendas: Number(stats.qtdVendas || 0)
                },
                historicoVendas: vendas,
                totalRegistros: total
            });
        } catch (err) {
            console.log("Erro no relatorio:", err);
            return res.status(500).json({ erro: "Nao deu pra carregar o relatorio" });
        }
    }

    // Pega os dados pro BI do restaurante
    static async getRestaurantBI(req: Request, res: Response) {
        const { restId } = req.params;
        const repoVenda = AppDataSource.getRepository(Venda);
        const repoItem = AppDataSource.getRepository(VendaItem);

        // Agrupa vendas por mes
        const mensal = await repoVenda.createQueryBuilder("venda")
            .select("strftime('%m/%Y', venda.dataCriacao)", "mes")
            .addSelect("SUM(venda.totalValor)", "receita")
            .addSelect("SUM(venda.totalLucro)", "lucro")
            .where("venda.restauranteId = :restId", { restId })
            .groupBy("mes")
            .orderBy("venda.dataCriacao", "DESC")
            .limit(6)
            .getRawMany();

        // Pega os 10 que mais venderam
        const top = await repoItem.createQueryBuilder("item")
            .innerJoin("item.venda", "venda")
            .select("item.nomeProduto", "nome")
            .addSelect("SUM(item.quantidade)", "qtdTotal")
            .addSelect("SUM(item.quantidade * item.precoVenda)", "valorTotal")
            .where("venda.restauranteId = :restId", { restId })
            .groupBy("item.nomeProduto")
            .orderBy("qtdTotal", "DESC")
            .limit(10)
            .getRawMany();

        return res.json({
            historicoMensal: mensal.map(r => ({
                mes: r.mes,
                receita: Number(r.receita),
                lucro: Number(r.lucro)
            })),
            topVendidos: top.map(s => ({
                nomeProduto: s.nome,
                quantidadeTotal: Number(s.qtdTotal),
                receitaTotal: Number(s.valorTotal)
            }))
        });
    }

    // Resumo rapido pros cards do dashboard
    static async getSummary(req: Request, res: Response) {
        const restId = (req as any).usuarioRestauranteId;
        const repo = AppDataSource.getRepository(Venda);

        const dados = await repo.createQueryBuilder("venda")
            .where("venda.restauranteId = :restId", { restId })
            .select("SUM(venda.totalValor)", "receita")
            .addSelect("SUM(venda.totalCusto)", "custo")
            .addSelect("SUM(venda.totalLucro)", "lucro")
            .addSelect("COUNT(venda.id)", "qtd")
            .getRawOne();

        return res.json({
            receitaTotal: Number(dados.receita || 0),
            custoTotal: Number(dados.custo || 0),
            lucroTotal: Number(dados.lucro || 0),
            quantidadeVendas: Number(dados.qtd || 0)
        });
    }
}