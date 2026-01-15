import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Restaurante } from "../entities/Restaurante.js";

export class RestauranteController {

    // Lista todos os restaurantes cadastrados no sistema
    static async listAll(_req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Restaurante);
        const lista = await repo.find();
        return res.json(lista);
    }

    // Pega os dados de um restaurante especifico
    static async show(req: Request, res: Response) {
        const { id } = req.params;
        const repo = AppDataSource.getRepository(Restaurante);

        try {
            const rest = await repo.findOneBy({ id: String(id) });

            if (!rest) {
                return res.status(404).json({ erro: "Restaurante sumiu do mapa" });
            }

            return res.json(rest);
        } catch (error) {
            console.log("Erro ao buscar restaurante:", error);
            return res.status(500).json({ erro: "Erro ao procurar os dados" });
        }
    }
}