import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const validate = (schema: any) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync(req.body);
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    erro: "Dados inválidos",
                    detalhes: error.issues.map(issue => ({
                        campo: issue.path.join("."),
                        mensagem: issue.message
                    }))
                });
            }
            return res.status(500).json({ erro: "Erro interno na validação." });
        }
    };
};