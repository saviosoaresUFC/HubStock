import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Mesa } from "../entities/Mesa.js";
import { Venda } from "../entities/Venda.js";

export class MesaController {

    // Lista as mesas do restaurante e vê se tem gente
    static async listByRestaurante(req: Request, res: Response) {
        const restauranteId = (req as any).usuarioRestauranteId;
        const mesaRepo = AppDataSource.getRepository(Mesa);
        const vendaRepo = AppDataSource.getRepository(Venda);

        try {
            // busca as mesas do restaurante em ordem
            const mesas = await mesaRepo.find({
                where: { restauranteId },
                order: { numero: "ASC" }
            });

            const listaFinal = [];

            // percorre as mesas pra ver qual tem pedido aberto
            for (const mesa of mesas) {
                const vendaAtiva = await vendaRepo.findOne({
                    where: {
                        mesaId: mesa.id,
                        totalValor: 0 // se o total é 0, a conta tá aberta
                    },
                    relations: ["items"]
                });

                // monta o objeto da mesa com os dados do pedido
                listaFinal.push({
                    ...mesa,
                    temVendaAtiva: !!vendaAtiva,
                    vendaId: vendaAtiva ? vendaAtiva.id : null,
                    quantidadeItens: vendaAtiva ? vendaAtiva.items.length : 0
                });
            }

            return res.json(listaFinal);
        } catch (error) {
            console.log("Erro ao pegar mesas:", error);
            return res.status(500).json({ erro: "Erro ao carregar as mesas" });
        }
    }

    // Pega o que a mesa já pediu até agora
    static async getPedidoAtivo(req: Request, res: Response) {
        const { mesaId } = req.params;
        const repo = AppDataSource.getRepository(Venda);

        try {
            // tenta achar uma venda que não foi fechada (total 0)
            const pedido = await repo.findOne({
                where: {
                    mesaId: mesaId as string,
                    totalValor: 0
                },
                relations: ["items"] // traz os produtos do pedido
            });

            // se não achar nada, manda uma lista vazia pro front não quebrar
            if (!pedido) {
                return res.json({ items: [] });
            }

            return res.json(pedido);
        } catch (error) {
            console.log("Erro no pedido ativo:", error);
            return res.status(500).json({ erro: "Erro ao buscar o pedido" });
        }
    }
}