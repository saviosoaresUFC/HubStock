import { defineStore } from 'pinia';
import { restaurantService } from '@/services/RestaurantService';
import { ref } from 'vue';
import type { Restaurante } from '@/types/entity-types';

export const useRestaurantStore = defineStore('restaurant', () => {
    const restaurants = ref<Restaurante[]>([]);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Carrega a lista de restaurantes
    async function loadRestaurants() {

        isLoading.value = true;
        error.value = null;
        try {
            restaurants.value = await restaurantService.getAllRestaurants();
        } catch (e: any) {
            error.value = e.response?.data?.erro || 'Falha ao carregar a lista de restaurantes.';
        } finally {
            isLoading.value = false;
        }
    }

    return {
        restaurants,
        isLoading,
        error,
        loadRestaurants,
    };
});