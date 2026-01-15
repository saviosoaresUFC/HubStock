import { defineStore } from 'pinia';
import { ref } from 'vue';
import { vendaService } from '@/services/VendaService';
import { mesaService } from '@/services/MesaService';

export const useVendaStore = defineStore('venda', () => {
    const pedidoAtual = ref<{ items: any[] }>({ items: [] });
    const isLoading = ref(false);

    async function loadPedido(mesaId: string) {
        isLoading.value = true;
        try {
            const data = await mesaService.getPedidoAtivo(mesaId);
            pedidoAtual.value.items = data.items || [];
        } catch (error) {
            pedidoAtual.value.items = [];
            console.error("Mesa vazia ou erro ao carregar: " + error);
        } finally {
            isLoading.value = false;
        }
    }

    async function adicionarItem(mesaId: string, produtoId: string, quantidade: number) {
        try {
            await vendaService.adicionarItem(mesaId, produtoId, quantidade);
            await loadPedido(mesaId);
        } catch (error: any) {
            console.error(error.response?.data?.erro || "Erro ao adicionar produto.");
            throw error;
        }
    }

    async function removerItem(mesaId: string, produtoId: string, quantidade: number) {
        try {
            await vendaService.removerItem(mesaId, produtoId, quantidade);
            await loadPedido(mesaId);
        } catch (error) {
            console.error("Erro ao remover item");
            throw error;
        }
    }

    async function finalizarVenda(mesaId: string) {
        isLoading.value = true;
        try {
            await vendaService.finalizarVenda(mesaId);
            pedidoAtual.value.items = [];
        } catch (error: any) {
            const msg = error.response?.data?.erro || "Erro ao finalizar";
            console.error(msg);
            throw error;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        pedidoAtual,
        isLoading,
        loadPedido,
        adicionarItem,
        removerItem,
        finalizarVenda
    };
});