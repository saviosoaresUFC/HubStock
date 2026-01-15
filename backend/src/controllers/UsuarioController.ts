import type { Request, Response } from "express";
import { AppDataSource } from "../config/data-source.js";
import { Usuario } from "../entities/Usuario.js";
import bcrypt from "bcryptjs";

export class UsuarioController {

    // Cria um usuario novo no sistema
    static async create(req: Request, res: Response) {
        const { nome, email, senha, role, restauranteId } = req.body;
        // pega os dados de quem ta logado
        const meuPapel = (req as any).usuarioRole;
        const meuRestaurante = (req as any).usuarioRestauranteId;

        const repo = AppDataSource.getRepository(Usuario);

        // olha se o email ja existe
        const jaExiste = await repo.findOneBy({ email });
        if (jaExiste) {
            return res.status(400).json({ erro: "E-mail já cadastrado." });
        }

        // encripta a senha antes de salvar
        const hash = await bcrypt.hash(senha, 10);
        let restauranteFinal = restauranteId;

        // se eu sou admin, o novo usuario tem que ser do meu restaurante obrigatoriamente
        if (meuPapel === 'ADMINISTRADOR') {
            restauranteFinal = meuRestaurante;
            if (role === 'SUPERADMINISTRADOR') {
                return res.status(403).json({ erro: "Voce nao pode criar um SuperAdmin." });
            }
        }

        const novo = repo.create({
            nome,
            email,
            senha: hash,
            role: role || 'GARCOM',
            restauranteId: restauranteFinal
        });

        await repo.save(novo);

        return res.status(201).json({ mensagem: "Usuario criado!" });
    }

    // Lista os usuarios que eu tenho permissao de ver
    static async list(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Usuario);
        const meuPapel = (req as any).usuarioRole;
        const meuRestaurante = (req as any).usuarioRestauranteId;

        // se for superadmin vê tudo, senao só vê quem é do mesmo restaurante
        const filtro = meuPapel === 'SUPERADMINISTRADOR' ? {} : { restauranteId: meuRestaurante };

        const lista = await repo.find({ where: filtro });
        return res.json(lista);
    }

    // Lista os usuarios de um restaurante específico
    static async listByRestaurante(req: Request, res: Response) {
        const repo = AppDataSource.getRepository(Usuario);

        const meuRestaurante = (req as any).usuarioRestauranteId;
        const meuPapel = (req as any).usuarioPapel;

        try {
            const filtro = meuPapel === 'SUPERADMINISTRADOR' ? {} : { restauranteId: meuRestaurante };

            const usuarios = await repo.find({
                where: filtro,
                select: ['id', 'nome', 'email', 'role', 'restauranteId']
            });

            return res.json(usuarios);
        } catch (error) {
            console.log("Erro ao buscar usuários do restaurante: ", error);
            return res.status(500).json({ erro: "Erro ao buscar usuários do restaurante." });
        }
    }

    // Atualiza dados basicos (nome, email, senha)
    static async update(req: Request, res: Response) {
        const { id } = req.params;
        const { nome, email, senha } = req.body;
        const repo = AppDataSource.getRepository(Usuario);

        try {
            // Busca o usuário no banco
            const user = await repo.findOneBy({ id: String(id) });
            if (!user) return res.status(404).json({ erro: "Usuário não encontrado." });

            user.nome = nome || user.nome;
            user.email = email || user.email;

            if (senha && senha.trim() !== "") {
                user.senha = await bcrypt.hash(senha, 10);
            }

            const usuarioSalvo = await repo.save(user);

            return res.json(usuarioSalvo);
        } catch (error) {
            console.log("Erro ao atualizar usuario: ", error);
            return res.status(500).json({ erro: "Erro ao atualizar no banco" });
        }
    }

    // Troca o cargo do usuario
    static async updateRole(req: Request, res: Response) {
        const { id } = req.params;
        const { role } = req.body;
        const meuPapel = (req as any).usuarioRole;

        const repo = AppDataSource.getRepository(Usuario);
        const user = await repo.findOneBy({ id: String(id) });

        if (!user) return res.status(404).json({ erro: "Usuário não encontrado" });

        // trava pra admin nao sair criando superadmin ou mexendo neles
        if (meuPapel === 'ADMINISTRADOR') {
            if (role === 'SUPERADMINISTRADOR' || user.role === 'SUPERADMINISTRADOR') {
                return res.status(403).json({ erro: "Você não pode criar ou modificar um SuperAdmin." });
            }
        }

        user.role = role;
        await repo.save(user);

        return res.json({ mensagem: "Cargo trocado!", dados: user });
    }

    // Apaga o usuario se ele nao tiver venda no nome dele
    static async delete(req: Request, res: Response) {
        const { id } = req.params;
        const repo = AppDataSource.getRepository(Usuario);

        try {
            const user = await repo.findOneBy({ id: String(id) });
            if (!user) return res.status(404).json({ erro: "Usuário não existe" });

            await repo.remove(user);
            return res.status(204).send();
        } catch (error) {
            console.log("Erro ao apagar usuario: ", error);
            return res.status(400).json({
                erro: "Não dá pra apagar esse usuário, ele ainda tem vendas no sistema."
            });
        }
    }
}