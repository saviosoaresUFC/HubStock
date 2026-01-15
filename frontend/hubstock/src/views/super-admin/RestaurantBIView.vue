<template>
    <div class="bi-container">
        <a-page-header :title="nomeRestaurante" @back="() => $router.back()" />

        <a-spin :spinning="biStore.carregando">

            <a-card title="Histórico de Faturamento e Lucro" style="margin-bottom: 30px;">
                <a-table :columns="colunasFaturamento" :data-source="biStore.historicoMensal" row-key="mes" size="small"
                    :pagination="false" :scroll="{ x: 600 }">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'receita'">
                            R$ {{ record.receita.toFixed(2) }}
                        </template>
                        <template v-if="column.key === 'lucro'">
                            <a-tag :color="record.lucro > 0 ? 'success' : 'error'">
                                R$ {{ record.lucro.toFixed(2) }}
                            </a-tag>
                        </template>
                    </template>
                </a-table>
            </a-card>

            <a-card title="Top 10 Produtos Mais Vendidos" style="margin-bottom: 30px;">
                <a-table :columns="colunasTopVendidos" :data-source="biStore.topMaisVendidos" row-key="nomeProduto"
                    size="small" :pagination="false" :scroll="{ x: 600 }">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'receitaTotal'">
                            R$ {{ record.receitaTotal.toFixed(2) }}
                        </template>
                    </template>
                </a-table>
            </a-card>

            <a-card title="Funcionários Cadastrados" style="margin-bottom: 30px;">
                <template #extra>
                    <a-button type="primary" @click="abrirModalUsuario">
                        <template #icon>
                            <UserAddOutlined />
                        </template>
                        Novo Usuário
                    </a-button>
                </template>

                <a-table :columns="colunasUsuarios" :data-source="usuariosFiltrados" row-key="id" size="small"
                    :loading="userStore.isLoading" :scroll="{ x: 700 }">
                    <template #bodyCell="{ column, record }">
                        <template v-if="column.key === 'role'">
                            <a-tag color="blue">{{ record.role }}</a-tag>
                        </template>
                        <template v-if="column.key === 'actions'">
                            <a-space>
                                <a-button type="link" size="small" @click="abrirModalEditar(record)">Editar</a-button>
                                <a-popconfirm title="Remover acesso?" @confirm="removerUsuario(record)">
                                    <a-button type="link" danger size="small">Remover</a-button>
                                </a-popconfirm>
                            </a-space>
                        </template>
                    </template>
                </a-table>
            </a-card>

            <a-modal v-model:open="modalUsuarioAberto" :title="editando ? 'Editar Usuário' : 'Novo Usuário'"
                @ok="salvarUsuario" :confirmLoading="userStore.isLoading">
                <a-form layout="vertical">
                    <a-form-item label="Nome Completo" required>
                        <a-input v-model:value="formularioUsuario.nome" placeholder="Nome do funcionário" />
                    </a-form-item>
                    <a-form-item label="E-mail" required>
                        <a-input v-model:value="formularioUsuario.email" placeholder="email@restaurante.com" />
                    </a-form-item>
                    <a-form-item label="Cargo" required>
                        <a-select v-model:value="formularioUsuario.role">
                            <a-select-option value="ADMINISTRADOR">ADMINISTRADOR</a-select-option>
                            <a-select-option value="GARCOM">GARÇOM</a-select-option>
                        </a-select>
                    </a-form-item>
                    <a-form-item :label="editando ? 'Nova Senha (opcional)' : 'Senha'" :required="!editando">
                        <a-input-password v-model:value="formularioUsuario.senha" />
                    </a-form-item>
                </a-form>
            </a-modal>

        </a-spin>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { useBistore } from '@/stores/biStore';
import { useUserStore } from '@/stores/userStore';
import { restaurantService } from '@/services/RestaurantService';
import { UserAddOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';

const route = useRoute();
const biStore = useBistore();
const userStore = useUserStore();
const restId = route.params.restId as string;

const nomeRestaurante = ref('Carregando...');
const modalUsuarioAberto = ref(false);
const editando = ref(false);
const idUsuarioEditando = ref<string | null>(null);

const formularioUsuario = reactive({
    nome: '',
    email: '',
    role: 'GARCOM',
    senha: ''
});

// Filtra os usuários da store global para mostrar apenas os deste restaurante
const usuariosFiltrados = computed(() => {
    return userStore.users.filter(u => u.restauranteId === restId);
});

const colunasFaturamento = [
    { title: 'Mês/Ano', dataIndex: 'mes', key: 'month' },
    { title: 'Faturamento', dataIndex: 'receita', key: 'receita' },
    { title: 'Lucro Líquido', dataIndex: 'lucro', key: 'lucro' },
];

const colunasTopVendidos = [
    { title: 'Produto', dataIndex: 'nomeProduto', key: 'nomeProduto' },
    { title: 'Qtd. Vendida', dataIndex: 'quantidadeTotal', key: 'totalQuantity' },
    { title: 'Total em Vendas', dataIndex: 'receitaTotal', key: 'receitaTotal' },
];

const colunasUsuarios = [
    { title: 'Nome', dataIndex: 'nome', key: 'nome' },
    { title: 'E-mail', dataIndex: 'email', key: 'email' },
    { title: 'Cargo', dataIndex: 'role', key: 'role' },
    { title: 'Ações', key: 'actions', width: 150 },
];

// Busca o nome do restaurante para exibir no título
const buscarNomeRestaurante = async () => {
    try {
        const res = await restaurantService.getRestaurantById(restId);
        nomeRestaurante.value = res.nomeRestaurante;
    } catch {
        nomeRestaurante.value = "Restaurante não encontrado";
    }
};

const abrirModalUsuario = () => {
    editando.value = false;
    Object.assign(formularioUsuario, { nome: '', email: '', role: 'GARCOM', senha: '' });
    modalUsuarioAberto.value = true;
};

const abrirModalEditar = (usuario: any) => {
    editando.value = true;
    idUsuarioEditando.value = usuario.id;
    Object.assign(formularioUsuario, {
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
        senha: ''
    });
    modalUsuarioAberto.value = true;
};

const salvarUsuario = async () => {
    try {
        if (editando.value && idUsuarioEditando.value) {
            // Atualiza o perfil do usuário
            await userStore.updateUserProfile(idUsuarioEditando.value, {
                nome: formularioUsuario.nome,
                email: formularioUsuario.email,
                senha: formularioUsuario.senha || undefined
            });
            await userStore.changeUserRole(idUsuarioEditando.value, formularioUsuario.role as any, formularioUsuario.nome);
            message.success('Funcionário atualizado!');
        } else {
            // Cria novo usuário direto no restaurante selecionado
            await userStore.registerUserInRestaurant({
                ...formularioUsuario,
                restauranteId: restId
            });
            message.success('Funcionário adicionado ao restaurante!');
        }
        modalUsuarioAberto.value = false;
        userStore.carregarUsuarios();
    } catch (e: any) {
        console.error(e);
        message.error('Erro ao salvar usuário');
    }
};

const removerUsuario = async (usuario: any) => {
    await userStore.deleteUser(usuario.id, usuario.nome);
    message.success("Funcionário deletado.")
};

onMounted(() => {
    biStore.loadRestaurantBI(restId);
    buscarNomeRestaurante();
    userStore.carregarUsuarios();
});
</script>

<style scoped>
.bi-container :deep(.ant-page-header) {
    padding-left: 0;
}

.bi-container {
    padding: 20px;
    max-width: 100vw;
    overflow-x: hidden;
}

.bi-container :deep(.ant-page-header-heading) {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.actions-cell {
    display: flex;
    gap: 8px;
    align-items: center;
}

.actions-cell :deep(.ant-btn-link) {
    padding: 0;
    height: auto;
}

:deep(.ant-table-body),
:deep(.ant-table-content) {
    overflow-x: auto !important;
    -webkit-overflow-scrolling: touch;
}
</style>