<template>
    <div class="pedido-detail-container">
        <a-page-header :title="`Pedido da Mesa ${numeroMesa}`" @back="() => $router.push({ name: 'MesaSelection' })">
            <template #extra>
                <a-popconfirm title="Deseja fechar a conta?" @confirm="handleFinalizeSale">
                    <a-button type="primary" danger class="finalize-desktop-btn"
                        :disabled="pedidoAtual.items.length === 0">
                        Finalizar Venda (R$ {{ mesaTotal.toFixed(2) }})
                    </a-button>
                </a-popconfirm>
            </template>
        </a-page-header>

        <a-layout class="pedido-layout">
            <a-layout-content class="pedido-content">
                <a-spin :spinning="isLoading">
                    <a-button type="primary" size="large" style="margin-bottom: 20px;" @click="isDrawerOpen = true">
                        <template #icon><shop-outlined /></template>
                        Lançar Pedido
                    </a-button>

                    <h3 class="list-title">Itens do Pedido</h3>

                    <a-list item-layout="horizontal" :data-source="pedidoAtual.items">
                        <template #renderItem="{ item }">
                            <a-list-item>
                                <a-list-item-meta :title="item.nomeProduto"
                                    :description="`Unitário: R$ ${Number(item.precoVenda).toFixed(2)}`" />

                                <QuantityControl :item="item" :loading="isLoading" @update-quantity="updateItemQuantity"
                                    @remove-item="removeItemFromMesaById" />

                                <div class="item-total-price">
                                    R$ {{ (Number(item.precoVenda) * item.quantidade).toFixed(2) }}
                                </div>
                            </a-list-item>
                        </template>
                    </a-list>

                    <a-statistic title="Total da Mesa" :value="mesaTotal" prefix="R$" class="mesa-statistic" />

                    <a-button type="primary" block size="large" class="finalize-mobile-btn"
                        @click="handleFinalizeSale()">
                        Finalizar Venda (R$ {{ mesaTotal.toFixed(2) }})
                    </a-button>
                </a-spin>
            </a-layout-content>
        </a-layout>

        <ProductDrawer :open="isDrawerOpen" :destroyOnClose="true" @close="isDrawerOpen = false"
            @product-selected="addProductToMesa" :drawer-width="drawerWidth" />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useProductStore } from '@/stores/productStore';
import { message } from 'ant-design-vue';
import ProductDrawer from '@/components/ProductDrawer.vue';
import { useMesaStore } from '@/stores/mesaStore';
import QuantityControl from '@/components/QuantityControl.vue';
import { useVendaStore } from '@/stores/vendaStore';
import { storeToRefs } from 'pinia';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const mesaStore = useMesaStore();
const vendaStore = useVendaStore();

const mesaId = route.params.mesaId as string;

const { pedidoAtual, isLoading } = storeToRefs(vendaStore);

const numeroMesa = computed(() => {
    if (route.params.numeroMesa) return route.params.numeroMesa;
    const mesaEncontrada = mesaStore.mesas.find(m => m.id === mesaId);
    return mesaEncontrada ? mesaEncontrada.numero : '...';
});

const isDrawerOpen = ref(false);
const windowWidth = ref(window.innerWidth);

// Atualiza o valor do ref quando a tela mudar
const updateWidth = () => {
    windowWidth.value = window.innerWidth;
};

const drawerWidth = computed(() => windowWidth.value > 600 ? 500 : '100%');

// Lança o produto
const addProductToMesa = async (product: any) => {
    await vendaStore.adicionarItem(mesaId, product.id, 1);

    const p = productStore.produtos.find(i => i.id === product.id);
    if (p) p.estoqueAtual -= 1;

    message.success(`${product.nomeProduto} lançado!`);
};

const mesaTotal = computed(() => {
    return pedidoAtual.value.items.reduce((sum, item) => sum + (item.precoVenda * item.quantidade), 0);
});

// Finalizar
const handleFinalizeSale = async () => {
    if (!pedidoAtual.value.items.length) return;
    try {
        await vendaStore.finalizarVenda(mesaId);
        message.success("Venda finalizada!");
        router.push({ name: 'MesaSelection' });
    } catch (e) {
        console.error(e);
        message.error("Erro ao finalizar venda.");
    }
};

// Atualizar quantidade
const updateItemQuantity = async (productId: string, newQuantity: number) => {
    const itemLocal = pedidoAtual.value.items.find(i => i.produtoId === productId);
    if (!itemLocal) return;

    const diferenca = newQuantity - itemLocal.quantidade;

    if (diferenca > 0) {
        await vendaStore.adicionarItem(mesaId, productId, Math.abs(diferenca));
        // baixa estoque local na store
        const p = productStore.produtos.find(i => i.id === productId);
        if (p) p.estoqueAtual -= Math.abs(diferenca);
    } else {
        await vendaStore.removerItem(mesaId, productId, Math.abs(diferenca));
        // devolve estoque local na store
        const p = productStore.produtos.find(i => i.id === productId);
        if (p) p.estoqueAtual += Math.abs(diferenca);
    }
};

// Remover total
const removeItemFromMesaById = async (productId: string) => {
    const itemLocal = pedidoAtual.value.items.find(i => i.produtoId === productId);
    if (itemLocal) {
        const quantidadeParaDevolver = itemLocal.quantidade;
        await vendaStore.removerItem(mesaId, productId, quantidadeParaDevolver);

        // devolve a quantidade total ao estoque local na store
        const p = productStore.produtos.find(i => i.id === productId);
        if (p) p.estoqueAtual += quantidadeParaDevolver;

        message.info('Produto removido');
    }
};

onMounted(() => {
    productStore.loadProduct();
    vendaStore.loadPedido(mesaId);
    mesaStore.loadMesas();

    // Adiciona o listener quando o componente monta
    window.addEventListener('resize', updateWidth);
});

onUnmounted(() => {
    // Remove o listener quando o componente é destruído
    window.removeEventListener('resize', updateWidth);
});
</script>

<style scoped>
.pedido-detail-container :deep(.ant-page-header) {
    padding-left: 0;
}

.pedido-detail-container {
    padding: 10px 20px;
}

.pedido-layout {
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.pedido-content {
    padding: 20px;
}

.ant-list-item :deep(.ant-list-item-meta-title) {
    font-weight: bold;
}

.ant-list-item :deep(.ant-list-item-meta-description) {
    color: #42b983;
}

.item-total-price {
    margin-left: auto;
    padding-left: 10px;
    font-size: 1.1em;
}

.list-title {
    margin-top: 15px;
    font-size: 1.2em;
    font-weight: bold;
}

.mesa-statistic {
    margin-top: 20px;
    text-align: end;
    font-weight: bolder;
    color: green;
}

.error-message {
    padding: 20px;
    color: red;
}

.finalize-mobile-btn {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    border-radius: 0;
    z-index: 10;
    padding: 15px;
    height: auto;
    font-size: 1.1em;
    display: none;
}

.finalize-desktop-btn {
    display: inline-block;
}

@media (max-width: 767px) {
    .finalize-mobile-btn {
        display: block;
    }

    .finalize-desktop-btn {
        display: none !important;
    }

    .ant-page-header-extra button:first-child {
        display: none;
    }

    .ant-statistic {
        margin-bottom: 70px;
    }
}
</style>