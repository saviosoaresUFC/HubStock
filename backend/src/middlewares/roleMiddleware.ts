import type { Request, Response, NextFunction } from "express";

export const authorize = (rolePermitidas: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = (req as any).usuarioRole;

        if (!rolePermitidas.includes(userRole)) {
            return res.status(403).json({
                error: "Acesso negado. Você não tem permissão para realizar esta ação."
            });
        }

        return next();
    };
};