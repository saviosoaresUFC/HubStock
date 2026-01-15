declare global {
    namespace Express {
        interface Request {
            usuarioId: string;
            usuarioNome: string;
            usuarioRole: string;
            usuarioRestauranteId: string | null;
        }
    }
}

export interface TokenPayload {
    id: string;
    papel: string;
    nome: string;
    restauranteId: string | null;
    iat: number;
    exp: number;
}

export enum UsuarioPapel {
    GARCOM = "GARCOM",
    ADMINISTRADOR = "ADMINISTRADOR",
    SUPERADMINISTRADOR = "SUPERADMINISTRADOR"
}

export enum UnidadeMedida {
    UNIDADE = "UN",
    QUILOGRAMA = "KG",
    LITRO = "LT",
    PACOTE = "PCT",
    GARRAFA = "GRF"
}
export enum CategoriaProduto {
    ENTRADAS = "ENTRADAS",
    BEBIDAS = "BEBIDAS",
    PRATOS_PRINCIPAIS = "PRATOS_PRINCIPAIS",
    PIZZAS = "PIZZAS",
    SOBREMESAS = "SOBREMESAS",
    SALADA = "SALADA",
    OUTROS = "OUTROS"
}

export enum TipoMovimentacaoEstoque {
    ENTRADA = "ENTRADA",
    SAIDA = "SAIDA"
}

export enum StatusMesa {
    DISPONIVEL = "DISPONIVEL",
    OCUPADA = "OCUPADA",
    RESERVADA = "RESERVADA"
}