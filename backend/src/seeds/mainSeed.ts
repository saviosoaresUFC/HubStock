import { AppDataSource } from "../config/data-source.js";
import { Usuario } from "../entities/Usuario.js";
import { Restaurante } from "../entities/Restaurante.js";
import { Produto } from "../entities/Produto.js";
import { Mesa } from "../entities/Mesa.js";
import { Venda } from "../entities/Venda.js";
import { VendaItem } from "../entities/VendaItem.js";
import bcrypt from "bcryptjs";
import { CategoriaProduto, UnidadeMedida, UsuarioPapel, StatusMesa } from "../types/index.js";

export const runSeeder = async () => {
    const restauranteRepo = AppDataSource.getRepository(Restaurante);
    const usuarioRepo = AppDataSource.getRepository(Usuario);
    const produtoRepo = AppDataSource.getRepository(Produto);
    const mesaRepo = AppDataSource.getRepository(Mesa);
    const vendaRepo = AppDataSource.getRepository(Venda);
    const itemVendaRepo = AppDataSource.getRepository(VendaItem);

    console.log("Iniciando Seeder");

    // Cria SuperAdmin se não existir
    const emailSuperAdmin = "savio@superadmin.com";
    const temSuper = await usuarioRepo.findOneBy({ email: emailSuperAdmin });
    if (!temSuper) {
        console.log("Criando SuperAdmin");
        const superAdmin = usuarioRepo.create({
            nome: "Sávio SuperAdmin",
            email: emailSuperAdmin,
            senha: await bcrypt.hash("25052022", 10),
            role: UsuarioPapel.SUPERADMINISTRADOR
        });
        await usuarioRepo.save(superAdmin);
    }

    // Cria Restaurante de Exemplo
    let restaurante = await restauranteRepo.findOneBy({ cnpjRestaurante: "12.345.678/0001-90" });
    if (!restaurante) {
        console.log("Criando Restaurante");
        restaurante = restauranteRepo.create({
            nomeRestaurante: "Autêntica - Comida Caseira",
            cnpjRestaurante: "12.345.678/0001-90",
            quantidadeMesas: 10,
            urlImagemPerfilRestaurante: "https://i.imgur.com/X0eeM1r.png"
        });
        await restauranteRepo.save(restaurante);
    }

    // Cria Mesas para o Restaurante, se não existirem
    const mesasExistentes = await mesaRepo.countBy({ restauranteId: restaurante.id });
    if (mesasExistentes === 0) {
        console.log(`Criando ${restaurante.quantidadeMesas} mesas`);
        for (let i = 1; i <= restaurante.quantidadeMesas; i++) {
            const mesa = mesaRepo.create({
                numero: i,
                status: i === 1 ? StatusMesa.OCUPADA : StatusMesa.DISPONIVEL, // Mesa 1 começa ocupada para teste
                restauranteId: restaurante.id
            });
            await mesaRepo.save(mesa);
        }
    }

    // Cria Usuários
    const adminEmail = "admin@autentica.com";
    let adminLocal = await usuarioRepo.findOneBy({ email: adminEmail });
    if (!adminLocal) {
        console.log("Criando Administrador do restaurante");
        adminLocal = usuarioRepo.create({
            nome: "Gerente Matriz",
            email: adminEmail,
            senha: await bcrypt.hash("25052022", 10),
            role: UsuarioPapel.ADMINISTRADOR,
            restauranteId: restaurante.id
        });
        await usuarioRepo.save(adminLocal);
    }

    // Cria Garçons
    const garcomReferencia = await usuarioRepo.findOneBy({ email: "garcom1@autentica.com" });
    if (!garcomReferencia) {
        console.log("Criando Garçons do restaurante");
        const garçons = usuarioRepo.create([
            {
                nome: "Garçom Autêntica 1",
                email: "garcom1@autentica.com",
                senha: await bcrypt.hash("25052022", 10),
                role: UsuarioPapel.GARCOM,
                restauranteId: restaurante.id
            },
            {
                nome: "Garçom Autêntica 2",
                email: "garcom2@autentica.com",
                senha: await bcrypt.hash("25052022", 10),
                role: UsuarioPapel.GARCOM,
                restauranteId: restaurante.id
            },
            {
                nome: "Garçom Autêntica 3",
                email: "garcom3@autentica.com",
                senha: await bcrypt.hash("25052022", 10),
                role: UsuarioPapel.GARCOM,
                restauranteId: restaurante.id
            }
        ]);
        await usuarioRepo.save(garçons);
    }

    // Cria Produtos
    let produtos = await produtoRepo.find();
    if (produtos.length === 0) {
        console.log("Criando Produtos");
        produtos = await produtoRepo.save([
            {
                nomeProduto: "Pilsen 350ml",
                descricao: "Cerveja Pilsen Long Neck 350ml",
                unidadeMedidaProduto: UnidadeMedida.UNIDADE,
                categoriaProduto: CategoriaProduto.BEBIDAS,
                precoCustoProduto: 2.5,
                precoVendaProduto: 5,
                urlImagemProduto: "https://i.imgur.com/vvezWgq.png",
                estoqueAtual: 100,
                restauranteId: restaurante.id
            },
            {
                nomeProduto: "Batata Frita",
                descricao: "Batata Frita Crocante 500g",
                categoriaProduto: CategoriaProduto.ENTRADAS,
                unidadeMedidaProduto: UnidadeMedida.QUILOGRAMA,
                precoCustoProduto: 12,
                precoVendaProduto: 30,
                urlImagemProduto: "https://i.imgur.com/vlzYlVE.png",
                estoqueAtual: 50,
                restauranteId: restaurante.id
            },
            {
                nomeProduto: "Pão Mineiro",
                descricao: "Pão Mineiro Tradicional",
                categoriaProduto: CategoriaProduto.OUTROS,
                unidadeMedidaProduto: UnidadeMedida.QUILOGRAMA,
                precoCustoProduto: 12,
                precoVendaProduto: 30,
                urlImagemProduto: "https://i.imgur.com/Ain4sQf.png",
                estoqueAtual: 55,
                restauranteId: restaurante.id
            },
            {
                nomeProduto: "Brahma 350ml",
                descricao: "Cerveja Brahma Long Neck 350ml",
                categoriaProduto: CategoriaProduto.BEBIDAS,
                unidadeMedidaProduto: UnidadeMedida.UNIDADE,
                precoCustoProduto: 2.5,
                precoVendaProduto: 5,
                urlImagemProduto: "https://i.imgur.com/ZTZ0eeM.png",
                estoqueAtual: 10,
                restauranteId: restaurante.id
            },
            {
                nomeProduto: "Skol 350ml",
                descricao: "Cerveja Skol Long Neck 350ml",
                categoriaProduto: CategoriaProduto.BEBIDAS,
                unidadeMedidaProduto: UnidadeMedida.UNIDADE,
                precoCustoProduto: 2.5,
                precoVendaProduto: 5,
                urlImagemProduto: "https://i.imgur.com/kRs4S0w.png",
                estoqueAtual: 10,
                restauranteId: restaurante.id
            },
        ]);
    }

    // Cria Vendas
    const totalVendas = await vendaRepo.countBy({ restauranteId: restaurante.id });
    if (totalVendas === 0) {
        console.log("Criando Vendas");

        for (let i = 0; i < 5; i++) {
            const dataVenda = new Date();
            dataVenda.setDate(dataVenda.getDate() - i);

            const mesa = await mesaRepo.findOneBy({ restauranteId: restaurante.id });

            const novaVenda = vendaRepo.create({
                restauranteId: restaurante.id,
                usuarioId: adminLocal.id,
                nomeUsuario: adminLocal.nome,
                totalValor: 0,
                totalCusto: 0,
                totalLucro: 0,
                ...(mesa?.id && { mesaId: mesa.id })
            });

            const vendaSalva = await vendaRepo.save(novaVenda);

            let somaValor = 0;
            let somaCusto = 0;

            for (const prod of produtos) {
                const qtd = Math.floor(Math.random() * 3) + 1;

                const item = itemVendaRepo.create({
                    vendaId: vendaSalva.id,
                    produtoId: prod.id,
                    nomeProduto: prod.nomeProduto,
                    quantidade: qtd,
                    precoVenda: Number(prod.precoVendaProduto),
                    precoCusto: Number(prod.precoCustoProduto),
                    totalLucro: (Number(prod.precoVendaProduto) - Number(prod.precoCustoProduto)) * qtd
                });
                await itemVendaRepo.save(item);

                somaValor += Number(prod.precoVendaProduto) * qtd;
                somaCusto += Number(prod.precoCustoProduto) * qtd;
            }

            vendaSalva.totalValor = somaValor;
            vendaSalva.totalCusto = somaCusto;
            vendaSalva.totalLucro = somaValor - somaCusto;

            await vendaRepo.save(vendaSalva);
        }
    }

    console.log("Seed finalizado!");
};