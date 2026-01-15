import type { Response } from "express";
import { ZodError } from "zod";

export const errorMiddleware = (
    erro: any,
    res: Response,
) => {
    // erros do Zod
    if (erro instanceof ZodError) {
        return res.status(400).json({
            erro: "Dados inválidos",
            detalhes: erro.issues.map(issue => ({
                campo: issue.path.join("."),
                mensagem: issue.message
            }))
        });
    }

    // erros comuns
    const status = erro.statusCode || 500;
    const mensagem = erro.message || "Erro interno no servidor";

    console.error(`[LOG DE ERRO]: ${mensagem}`);

    return res.status(status).json({
        erro: mensagem
    });
};