import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Venda } from "../entities/Venda.js";
import { VendaItem } from "../entities/VendaItem.js";
import { Produto } from "../entities/Produto.js";
import { Mesa } from "../entities/Mesa.js";
import { StatusMesa } from "../types/index.js";

export class VendaController {

    // Fecha a conta da mesa e calcula os totais de lucro e custo
    static async finalizarVenda(req: Request, res: Response) {
        const { mesaId } = req.params;
        const repoVenda = AppDataSource.getRepository(Venda);
        const repoMesa = AppDataSource.getRepository(Mesa);

        try {
            // busca a venda que ainda esta com valor 0 (aberta)
            const venda = await repoVenda.findOne({
                where: { mesaId: String(mesaId), totalValor: 0 },
                relations: ["items"]
            });

            if (!venda) return res.status(400).json({ erro: "Nao achei pedido aberto pra essa mesa." });

            let total = 0;
            let custo = 0;
            let lucro = 0;

            for (const item of venda.items) {
                total += Number(item.precoVenda) * item.quantidade;
                custo += Number(item.precoCusto) * item.quantidade;
                lucro += Number(item.totalLucro);
            }

            // atualiza a venda com os valores finais
            venda.totalValor = total;
            venda.totalCusto = custo;
            venda.totalLucro = lucro;
            venda.mesaId = (null as any); // tira a mesa da venda pra ela ficar livre

            await repoVenda.save(venda);

            // libera a mesa pra outro cliente usar
            const mesa = await repoMesa.findOneBy({ id: String(mesaId) });
            if (mesa) {
                mesa.status = StatusMesa.DISPONIVEL;
                await repoMesa.save(mesa);
            }

            return res.json({ mensagem: "Conta fechada com sucesso!" });
        } catch (err) {
            console.log("Erro ao fechar conta:", err);
            return res.status(500).json({ erro: "Erro ao fechar a conta." });
        }
    }

    // Lança um produto na mesa e ja tira do estoque
    static async adicionarItem(req: Request, res: Response) {
        const { mesaId, produtoId, quantidade } = req.body;
        const repoItem = AppDataSource.getRepository(VendaItem);
        const repoVenda = AppDataSource.getRepository(Venda);
        const repoProd = AppDataSource.getRepository(Produto);

        try {
            const prod = await repoProd.findOneBy({ id: produtoId });
            if (!prod) return res.status(404).json({ erro: "Produto nao existe." });

            // nao deixa vender se nao tiver no estoque
            if (prod.estoqueAtual < quantidade) {
                return res.status(400).json({ erro: "Estoque acabou!" });
            }

            // ve se ja tem uma venda aberta pra essa mesa
            let venda = await repoVenda.findOneBy({ mesaId, totalValor: 0 });

            if (!venda) {
                venda = repoVenda.create({
                    mesaId,
                    restauranteId: (req as any).usuarioRestauranteId,
                    usuarioId: (req as any).usuarioId,
                    nomeUsuario: (req as any).usuarioNome,
                    totalValor: 0, totalCusto: 0, totalLucro: 0
                });
                venda = await repoVenda.save(venda);
            }

            // tira do estoque na hora do lancamento
            prod.estoqueAtual -= Number(quantidade);
            await repoProd.save(prod);

            // ve se o item ja existe no pedido pra so somar a quantidade
            let item = await repoItem.findOneBy({ vendaId: venda.id, produtoId });

            if (item) {
                item.quantidade += Number(quantidade);
                item.totalLucro = (Number(item.precoVenda) - Number(item.precoCusto)) * item.quantidade;
                await repoItem.save(item);
            } else {
                // se for produto novo no pedido, cria do zero
                item = repoItem.create({
                    vendaId: venda.id,
                    produtoId: prod.id,
                    quantidade: Number(quantidade),
                    nomeProduto: prod.nomeProduto,
                    precoVenda: prod.precoVendaProduto,
                    precoCusto: prod.precoCustoProduto,
                    totalLucro: (Number(prod.precoVendaProduto) - Number(prod.precoCustoProduto)) * Number(quantidade)
                });
                await repoItem.save(item);
            }

            return res.json({ mensagem: "Produto lancado!" });
        } catch (err) {
            console.log("Erro ao lancar item:", err);
            return res.status(500).json({ erro: "Erro ao lancar o item." });
        }
    }

    // Tira um item do pedido e devolve pro estoque
    static async removerItem(req: Request, res: Response) {
        const { mesaId, produtoId, quantidade } = req.body;
        const repoItem = AppDataSource.getRepository(VendaItem);
        const repoVenda = AppDataSource.getRepository(Venda);
        const repoProd = AppDataSource.getRepository(Produto);

        try {
            const venda = await repoVenda.findOneBy({ mesaId, totalValor: 0 });
            if (!venda) return res.status(404).json({ erro: "Nao achei a venda." });

            const item = await repoItem.findOneBy({ vendaId: venda.id, produtoId });
            if (!item) return res.status(404).json({ erro: "Item nao ta no pedido." });

            // devolve pro estoque o que foi cancelado
            const prod = await repoProd.findOneBy({ id: produtoId });
            if (prod) {
                prod.estoqueAtual += Number(quantidade);
                await repoProd.save(prod);
            }

            // se sobrar quantidade ainda deixa o item lá, senao apaga de vez
            if (item.quantidade > Number(quantidade)) {
                item.quantidade -= Number(quantidade);
                item.totalLucro = (Number(item.precoVenda) - Number(item.precoCusto)) * item.quantidade;
                await repoItem.save(item);
            } else {
                await repoItem.remove(item);
            }

            return res.json({ mensagem: "Item removido e estoque devolvido." });
        } catch (err) {
            console.log("Erro ao remover:", err);
            return res.status(500).json({ erro: "Nao deu pra remover o item." });
        }
    }
}