import api from './ApiService';
import type { Produto } from '@/types/entity-types';

class ProductService {
    /**
     * Busca todos os produtos do restaurante
     */
    public async getAllProducts(busca?: string): Promise<Produto[]> {
        const { data } = await api.get<Produto[]>('/produtos', 
            { params: { busca } }
        );
        return data;
    }

    /**
     * Busca um produto específico
     */
    public async getProductById(id: string): Promise<Produto> {
        const { data } = await api.get<Produto>(`/produtos/${id}`);
        return data;
    }

    /**
     * Cria um novo produto
     */
    public async createProduct(productData: Partial<Produto>): Promise<Produto> {
        const { data } = await api.post('/produtos', productData);
        return data.dados;
    }

    /**
     * Atualiza um produto
     */
    public async updateProduct(id: string, productData: Partial<Produto>): Promise<Produto> {
        const { data } = await api.put(`/produtos/${id}`, productData);
        return data.dados;
    }

    /**
     * Exclui um produto
     */
    public async deleteProduct(id: string): Promise<void> {
        await api.delete(`/produtos/${id}`);
    }

    /**
     * Registra entrada de mercadoria no estoque
     */
    public async registerStockEntry(
        productId: string,
        quantity: number,
        notes?: string
    ): Promise<Produto> {
        const { data } = await api.patch(`/produtos/${productId}/estoque`, {
            quantidade: quantity,
            tipo: 'ENTRADA',
            observacao: notes
        });
        return data.dados;
    }
}

export const productService = new ProductService();