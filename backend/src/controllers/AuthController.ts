import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Usuario } from "../entities/Usuario.js";
import { StatusMesa, UsuarioPapel } from "../types/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Restaurante } from "../entities/Restaurante.js";
import { Mesa } from "../entities/Mesa.js";

export class AuthController {

    static async login(req: Request, res: Response) {
        const { email, senha } = req.body;
        const repo = AppDataSource.getRepository(Usuario);

        // tenta achar o usuário pelo email
        const user = await repo.findOne({
            where: { email },
            select: ["id", "nome", "email", "senha", "role", "restauranteId"],
            relations: ["restaurante"]
        });

        if (!user) {
            return res.status(401).json({ erro: "Email ou senha errados" });
        }

        // vê se a senha bate
        const senhaOk = await bcrypt.compare(senha, user.senha);
        if (!senhaOk) {
            return res.status(401).json({ erro: "Email ou senha errados" });
        }

        // define a foto que vai aparecer no sistema
        let foto = user.role === UsuarioPapel.SUPERADMINISTRADOR
            ? "https://i.imgur.com/KnmpSoj.png"
            : user.restaurante?.urlImagemPerfilRestaurante || "https://i.imgur.com/ZasiMly.png";

        // cria o token pra manter o user logado
        const token = jwt.sign(
            { id: user.id, papel: user.role, restauranteId: user.restauranteId, nome: user.nome },
            process.env["JWT_SECRET"] || "chave_secreta_hubstock",
            { expiresIn: "1d" }
        );

        return res.json({
            usuario: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                papel: user.role,
                restauranteId: user.restauranteId,
                imagemPerfil: foto
            },
            token
        });
    }

    static async register(req: Request, res: Response) {
        const {
            nomeRestaurante, cnpjRestaurante, urlImagemPerfilRestaurante,
            quantidadeMesas, nomeAdministrador, emailAdministrador, senhaAdministrador
        } = req.body;

        const repoRestaurante = AppDataSource.getRepository(Restaurante);
        const repoMesa = AppDataSource.getRepository(Mesa);
        const repoUsuario = AppDataSource.getRepository(Usuario);

        try {
            // salva primeiro o restaurante
            const novoRestaurante = repoRestaurante.create({
                nomeRestaurante,
                cnpjRestaurante,
                urlImagemPerfilRestaurante,
                quantidadeMesas: quantidadeMesas || 10
            });
            const restauranteSalvo = await repoRestaurante.save(novoRestaurante);

            // cria as mesas desse restaurante no laço
            const totalMesas = quantidadeMesas || 10;
            for (let i = 1; i <= totalMesas; i++) {
                const mesa = repoMesa.create({
                    numero: i,
                    status: StatusMesa.DISPONIVEL,
                    restauranteId: restauranteSalvo.id
                });
                await repoMesa.save(mesa);
            }

            // cria o usuário que manda em tudo no restaurante
            const senhaCripto = await bcrypt.hash(senhaAdministrador, 10);
            const novoAdmin = repoUsuario.create({
                nome: nomeAdministrador,
                email: emailAdministrador,
                senha: senhaCripto,
                role: UsuarioPapel.ADMINISTRADOR,
                restauranteId: restauranteSalvo.id
            });
            await repoUsuario.save(novoAdmin);

            return res.status(201).json({
                mensagem: "Tudo certo! Restaurante e admin criados."
            });

        } catch (error) {
            console.log("Deu ruim no cadastro: ", error);
            return res.status(400).json({ erro: "Erro ao cadastrar, revisa novamente os campos." });
        }
    }
}