<template>
  <div class="produto-container">
    <a-page-header title="Estoque de Produtos">
      <template #extra>
        <a-space>
          <a-button @click="filtroEstoqueBaixo = !filtroEstoqueBaixo" :danger="filtroEstoqueBaixo">
            <template #icon><alert-outlined /></template>
            {{ filtroEstoqueBaixo ? 'Mostrar Todos' : 'Ver Estoque Baixo' }}
          </a-button>

          <a-button type="primary" @click="abrirModalCriar">
            <template #icon><plus-outlined /></template>
            Novo Produto
          </a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-table :columns="colunas" :data-source="listaFiltrada" :loading="productStore.isLoading" row-key="id"
      :scroll="{ x: 900 }">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'image'">
          <a-avatar shape="square" :size="40" :src="record.urlImagemProduto || IMAGEM_PADRAO" />
        </template>

        <template v-if="column.key === 'currentStock'">
          <a-tag :color="record.estoqueAtual <= 10 ? 'volcano' : 'green'">
            {{ record.estoqueAtual }} {{ record.unidadeMedidaProduto }}
          </a-tag>
        </template>

        <template v-if="column.key === 'action'">
          <a-space>
            <a-button type="link" @click="abrirModalEstoque(record)" title="Adicionar Estoque" style="color: #fa8c16">
              <template #icon><import-outlined /></template>
            </a-button>

            <a-button type="link" @click="abrirModalEditar(record)" title="Editar">
              <template #icon><edit-outlined /></template>
            </a-button>

            <a-popconfirm title="Quer mesmo excluir?" @confirm="deletarProduto(record.id, record.nomeProduto)">
              <a-button type="link" danger title="Excluir">
                <template #icon><delete-outlined /></template>
              </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <ProductForm v-if="modalAberto" :open="modalAberto" :product="produtoSelecionado" @close="fecharModal"
      @saved="productStore.loadProduct()" />

    <StockEntryForm :open="modalEstoqueAberto" :product="produtoSelecionado" :isLoading="productStore.isLoading"
      @close="fecharModalEstoque" @confirm="confirmarEstoque" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useProductStore } from '@/stores/productStore';
import { message } from 'ant-design-vue';
import { PlusOutlined, EditOutlined, DeleteOutlined, ImportOutlined, AlertOutlined } from '@ant-design/icons-vue';
import ProductForm from '@/components/ProductForm.vue';
import StockEntryForm from './components/StockEntryForm.vue';
import type { Produto } from '@/types/entity-types';

const productStore = useProductStore();
const IMAGEM_PADRAO = 'https://placehold.co/50x50?text=P';

const modalAberto = ref(false);
const modalEstoqueAberto = ref(false);
const produtoSelecionado = ref<Produto | null>(null);
const filtroEstoqueBaixo = ref(false);

// Filtro q decide o que mostrar na tabela
const listaFiltrada = computed(() => {
  return filtroEstoqueBaixo.value ? productStore.estoqueBaixo : productStore.produtos;
});

const colunas = [
  { title: 'Imagem', key: 'image', width: 80 },
  { title: 'Nome', dataIndex: 'nomeProduto', key: 'name', sorter: (a: Produto, b: Produto) => a.nomeProduto.localeCompare(b.nomeProduto) },
  { title: 'Categoria', dataIndex: 'categoriaProduto', key: 'category' },
  { title: 'Estoque', dataIndex: 'estoqueAtual', key: 'currentStock', width: 120 },
  { title: 'Preço', dataIndex: 'precoVendaProduto', key: 'price', customRender: ({ text }: { text: number }) => `R$ ${text.toFixed(2)}` },
  { title: 'Ações', key: 'action', width: 150, fixed: 'right' },
];

const abrirModalCriar = () => {
  produtoSelecionado.value = null;
  modalAberto.value = true;
};

const abrirModalEditar = (produto: Produto) => {
  produtoSelecionado.value = produto;
  modalAberto.value = true;
};

const fecharModal = () => {
  modalAberto.value = false;
  produtoSelecionado.value = null;
};

const abrirModalEstoque = (produto: Produto) => {
  produtoSelecionado.value = produto;
  modalEstoqueAberto.value = true;
};

const fecharModalEstoque = () => {
  modalEstoqueAberto.value = false;
};

// Quando confirma a entrada de estoque
const confirmarEstoque = async (dados: { productId: string; quantity: number, notes: string }) => {
  try {
    await productStore.addStock(dados.productId, dados.quantity, dados.notes);
    message.success('Estoque atualizado com sucesso!');
    fecharModalEstoque();
    productStore.loadProduct(); // Recarrega a lista
  } catch (e) {
    console.error(e);
    message.error('Erro ao atualizar o estoque.');
  }
};

const deletarProduto = async (id: string, nome: string) => {
  try {
    await productStore.removeProduct(id);
    message.success(`${nome} removido do sistema.`);
  } catch (e) {
    console.error(e);
    message.error('Não foi possível excluir.');
  }
};

onMounted(() => {
  productStore.loadProduct();
});
</script>

<style scoped>
.produto-container {
  padding: 20px;
  max-width: 100vw;
  overflow-x: hidden;
}

.produto-container :deep(.ant-page-header) {
  padding-left: 0;
  padding-right: 0;
}

.produto-container :deep(.ant-page-header-heading) {
  flex-wrap: wrap;
  gap: 2px;
}

.produto-container :deep(.ant-page-header-heading-left) {
  flex: 1;
  min-width: 200px;
}

.produto-container :deep(.ant-page-header-heading-extra) {
  margin-left: 0;
  padding-top: 8px;
}

.produto-container :deep(.ant-page-header-heading-title) {
  flex-direction: column;
  align-items: flex-start;
}

.product-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
}

.actions-cell :deep(.ant-btn) {
  padding: 4px 8px;
}

:deep(.ant-table-content) {
  overflow-x: auto !important;
  -webkit-overflow-scrolling: touch;
}

:deep(.ant-table-cell) {
  white-space: nowrap;
}

@media (max-width: 576px) {
  .produto-container :deep(.ant-space) {
    width: 100%;
    display: flex;
    justify-content: flex-start;
  }
}
</style>