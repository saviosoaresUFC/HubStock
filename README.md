# :checkered_flag: HubStock


## :technologist: Membros da equipe

552882 - Sávio de Carvalho Soares - Engenharia de Software

## :bulb: Objetivo Geral
O HubStock é um gerenciador de estoque de restaurantes, bares e etc. O seu objetivo é controlar o que entra e o que sai de mercadorias como bebidas, objetos para aluguel (hora/dia/semana), comidas e entre outras coisas.

## :eyes: Público-Alvo
Dono de Restaurantes/Bares

## :star2: Impacto Esperado
1. Espera-se que os estabelecimentos a serem atendidos tenham um maior controle e saibam a hora exata de repôr mercadorias. 
2. Saibam quanto de vendas estão tendo no dia/mês/ano.

## :people_holding_hands: Papéis ou tipos de usuário da aplicação
Garçom, Administrador e SuperAdministrador 

## :triangular_flag_on_post:	 Principais funcionalidades da aplicação
As funcionalidades do HubStock serão divididas para garantir que cada tipo de usuário (Administrador e Garçom) tenha as ferramentas necessárias para cumprir seu papel, mantendo a segurança e o controle de acesso.

| Funcionalidade | Acesso | Papéis de Acesso |
| :--- | :--- | :--- |
| **Login/Logout** | Acessível a todos os usuários. | Todos |
| **Registro de Saída de Produto (Venda)** | Acessível a todos os usuários. | Garçom, Administrador, SuperAdministrador |
| **Visualizar Nível de Estoque** | Acessível a todos os usuários. | Garçom, Administrador, SuperAdministrador |
| **Gerenciar Produtos / Itens** | Restrita a certos tipos de usuários. | Administrador, SuperAdministrador |
| **Registro de Entrada de Mercadoria** | Restrita a certos tipos de usuários. | Administrador, SuperAdministrador |
| **Relatórios de Vendas e Lucros** | Restrita a certos tipos de usuários. | Administrador, SuperAdministrador |
| **Gerenciamento de Usuários** | Restrita a certos tipos de usuários. | Administrador, SuperAdministrador |
## :spiral_calendar: Entidades ou tabelas do sistema
1.  **USUARIO**
2.  **CATEGORIA** (Para agrupar produtos - ex: Bebidas, Comidas, Aluguel)
3.  **PRODUTO** (O estoque)
4.  **MOVIMENTACAO_ESTOQUE** (Registra toda entrada e saída de PRODUTO)
5.  **VENDA** (Registra as transações para os relatórios)
6.  **ITEM_VENDA** (Os produtos que estavam em uma VENDA específica)

