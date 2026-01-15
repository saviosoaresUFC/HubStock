import type { Request, Response } from "express";
import { ProdutoService } from "../services/ProdutoService.js";

const service = new ProdutoService();

export class ProdutoController {

    static async list(req: Request, res: Response) {
        try {
            const restId = (req as any).usuarioRestauranteId;
            const busca = req.query['busca'] as string;
            const lista = await service.listarProdutos(restId, busca);
            return res.json(lista);
        } catch (err) {
            console.log(err)
            return res.status(500).json({ erro: "Erro ao listar produtos" });
        }
    }

    static async getById(req: Request, res: Response) {
        try {
            const restId = (req as any).usuarioRestauranteId;
            const prod = await service.buscarPorId(String(req.params['id']), restId);
            return res.json(prod);
        } catch (err: any) {
            return res.status(404).json({ erro: err.message });
        }
    }

    static async create(req: Request, res: Response) {
        try {
            const restId = (req as any).usuarioRestauranteId;
            const novo = await service.criarProduto(req.body, restId);
            return res.status(201).json(novo);
        } catch (err) {
            console.log(err)
            return res.status(400).json({ erro: "Erro ao criar produto" });
        }
    }

    static async update(req: Request, res: Response) {
        try {
            const restId = (req as any).usuarioRestauranteId;
            const atualizado = await service.atualizarProduto(String(req.params['id']), restId, req.body);
            return res.json(atualizado);
        } catch (err: any) {
            return res.status(404).json({ erro: err.message });
        }
    }

    static async delete(req: Request, res: Response) {
        try {
            const restId = (req as any).usuarioRestauranteId;
            await service.deletarProduto(String(req.params['id']), restId);
            return res.status(204).send();
        } catch (err: any) {
            return res.status(404).json({ erro: err.message });
        }
    }

    static async updateStock(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).usuarioId;
            const restId = (req as any).usuarioRestauranteId;

            const service = new ProdutoService();
            const novoTotal = await service.movimentarEstoque(String(id), restId, userId, req.body);

            return res.json({ mensagem: "Estoque atualizado!", novoTotal });
        } catch (err: any) {
            console.error(err);
            return res.status(400).json({ erro: err.message || "Erro ao atualizar o estoque" });
        }
    }
}