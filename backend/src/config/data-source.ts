import "reflect-metadata";
import { DataSource } from "typeorm";
import { Usuario } from "../entities/Usuario.js";
import { Produto } from "../entities/Produto.js";
import { Venda } from "../entities/Venda.js";
import { VendaItem } from "../entities/VendaItem.js";
import { Restaurante } from "../entities/Restaurante.js";
import { MovimentacaoEstoque } from "../entities/MovimentacaoEstoque.js";
import { Mesa } from "../entities/Mesa.js";

export const AppDataSource = new DataSource({
    type: "sqlite",
    database: "./database.sqlite",
    synchronize: true,
    logging: false,
    entities: [Usuario, Produto, Venda, VendaItem, Restaurante, MovimentacaoEstoque, Mesa],
    migrations: [],
    subscribers: [],
});