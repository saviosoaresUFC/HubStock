import { AppDataSource } from "../config/data-source.js";
import { Produto } from "../entities/Produto.js";
import { MovimentacaoEstoque } from "../entities/MovimentacaoEstoque.js";
import { Like } from "typeorm";
import { TipoMovimentacaoEstoque } from "../types/index.js";

export class ProdutoService {
    private get repoProd() { return AppDataSource.getRepository(Produto); }
    private get repoLog() { return AppDataSource.getRepository(MovimentacaoEstoque); }

    async listarProdutos(restauranteId: string, busca?: string) {
        let onde: any = { restauranteId };
        if (busca) {
            onde.nomeProduto = Like(`%${busca}%`);
        }
        return await this.repoProd.find({
            where: onde,
            order: { nomeProduto: "ASC" }
        });
    }

    async buscarPorId(id: string, restauranteId: string) {
        const produto = await this.repoProd.findOneBy({ id, restauranteId });
        if (!produto) throw new Error("Produto não encontrado");
        return produto;
    }

    async criarProduto(dados: Produto, restauranteId: string) {
        const novo = this.repoProd.create({ ...dados, restauranteId });
        return await this.repoProd.save(novo);
    }

    async atualizarProduto(id: string, restauranteId: string, dados: Produto) {
        const produto = await this.repoProd.findOneBy({ id, restauranteId });
        if (!produto) throw new Error("Produto não encontrado");

        Object.assign(produto, dados);
        return await this.repoProd.save(produto);
    }

    async deletarProduto(id: string, restauranteId: string) {
        const repoProd = AppDataSource.getRepository(Produto);
        const repoLog = AppDataSource.getRepository(MovimentacaoEstoque);

        const produto = await repoProd.findOneBy({ id: String(id), restauranteId });
        if (!produto) throw new Error("Produto não encontrado");

        // apaga as movimentações de estoque do produto primeiro
        await repoLog.delete({ produtoId: id });

        // apaga o produto
        return await repoProd.remove(produto);
    }

    async movimentarEstoque(id: string, restId: string, userId: string, dados: MovimentacaoEstoque) {
        const { quantidade, tipo, observacao } = dados;

        const prod = await this.repoProd.findOneBy({
            id: String(id),
            restauranteId: String(restId)
        });

        if (!prod) throw new Error("Produto não encontrado.");

        const qtd = Number(quantidade);
        const estoqueAtual = Number(prod.estoqueAtual);

        if (tipo === TipoMovimentacaoEstoque.ENTRADA) {
            prod.estoqueAtual = estoqueAtual + qtd;
        } else {
            if (estoqueAtual < qtd) throw new Error("Estoque insuficiente.");
            prod.estoqueAtual = estoqueAtual - qtd;
        }

        await this.repoProd.save(prod);

        const novoLog = this.repoLog.create({
            tipo: tipo,
            quantidade: qtd,
            observacao: observacao || "",
            produtoId: id,
            responsavelId: userId
        });

        await this.repoLog.save(novoLog);
        return prod.estoqueAtual;
    }
}