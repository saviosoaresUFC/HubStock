<template>
  <a-modal :open="open" :title="isEditMode ? 'Editar Produto' : 'Adicionar Novo Produto'" @cancel="$emit('close')"
    @ok="handleSubmit" :confirm-loading="isLoading">
    <a-form layout="vertical">

      <a-form-item label="Nome do Produto" required>
        <a-input v-model:value="formState.nomeProduto" placeholder="Ex: Cerveja Pilsen Lata 350ml" />
      </a-form-item>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Categoria" required>
            <a-select v-model:value="formState.categoriaProduto" placeholder="Selecione">
              <a-select-option value="ENTRADAS">ENTRADAS</a-select-option>
              <a-select-option value="BEBIDAS">BEBIDAS</a-select-option>
              <a-select-option value="PRATOS_PRINCIPAIS">PRATOS PRINCIPAIS</a-select-option>
              <a-select-option value="PIZZAS">PIZZAS</a-select-option>
              <a-select-option value="SOBREMESAS">SOBREMESAS</a-select-option>
              <a-select-option value="SALADA">SALADA</a-select-option>
              <a-select-option value="OUTROS">OUTROS</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="Unidade de Medida" required>
            <a-select v-model:value="formState.unidadeMedidaProduto" placeholder="Ex: UNIDADE">
              <a-select-option value="UN">UNIDADE</a-select-option>
              <a-select-option value="LT">LITRO</a-select-option>
              <a-select-option value="KG">QUILOGRAMA</a-select-option>
              <a-select-option value="PCT">PACOTE</a-select-option>
              <a-select-option value="GRF">GARRAFA</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="16">
        <a-col :span="12">
          <a-form-item label="Preço de Custo (R$)" required>
            <a-input-number v-model:value="formState.precoCustoProduto" :min="0" style="width: 100%"
              placeholder="10.00" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="Preço de Venda (R$)" required>
            <a-input-number v-model:value="formState.precoVendaProduto" :min="0" style="width: 100%"
              placeholder="15.00" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="Descrição">
        <a-textarea v-model:value="formState.descricao" :rows="2" placeholder="Breve descrição do produto" />
      </a-form-item>

      <a-form-item label="URL da Imagem">
        <a-input v-model:value="formState.urlImagemProduto" placeholder="https://link-da-imagem.com/foto.jpg" />
      </a-form-item>

      <a-form-item v-if="!isEditMode" label="Estoque Inicial" required>
        <a-input-number v-model:value="formState.estoqueAtual" :min="0" style="width: 100%" placeholder="Ex: 50" />
      </a-form-item>

      <a-alert v-if="error" message="Erro ao salvar" :description="error" type="error" show-icon
        style="margin-top: 15px;" />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue';
import { useProductStore } from '@/stores/productStore';
import type { Produto, UnidadeMedida, CategoriaProduto } from '@/types/entity-types';
import { message } from 'ant-design-vue';

const productStore = useProductStore();

const props = defineProps<{
  open: boolean;
  product?: Produto | null;
}>();

const emit = defineEmits(['close', 'saved']);

const defaultFormState = {
  nomeProduto: '',
  descricao: '',
  categoriaProduto: undefined as CategoriaProduto | undefined,
  unidadeMedidaProduto: 'UNIDADE' as UnidadeMedida,
  precoCustoProduto: null as number | null,
  precoVendaProduto: null as number | null,
  estoqueAtual: 0,
  urlImagemProduto: '',
};

const formState = ref({ ...defaultFormState });
const isLoading = ref(false);
const error = ref<string | null>(null);

const isEditMode = computed(() => !!props.product);

const populateForm = () => {
  if (props.product) {
    formState.value = {
      nomeProduto: props.product.nomeProduto,
      descricao: props.product.descricao || '',
      categoriaProduto: props.product.categoriaProduto,
      unidadeMedidaProduto: props.product.unidadeMedidaProduto,
      precoCustoProduto: props.product.precoCustoProduto,
      precoVendaProduto: props.product.precoVendaProduto,
      estoqueAtual: props.product.estoqueAtual,
      urlImagemProduto: props.product.urlImagemProduto || '',
    };
  } else {
    formState.value = { ...defaultFormState };
  }
};

watch(() => props.open, (newOpen) => {
  if (newOpen) {
    error.value = null;
    populateForm();
  }
}, { immediate: true });

const validate = () => {
  if (
    !formState.value.nomeProduto ||
    !formState.value.categoriaProduto ||
    formState.value.precoCustoProduto === null ||
    formState.value.precoVendaProduto === null
  ) {
    error.value = 'Preencha todos os campos obrigatórios.';
    return false;
  }
  if (Number(formState.value.precoCustoProduto) >= Number(formState.value.precoVendaProduto)) {
    error.value = 'O preço de venda deve ser maior que o preço de custo.';
    return false;
  }
  return true;
};

const handleSubmit = async () => {
  if (!validate()) return;

  isLoading.value = true;
  error.value = null;

  try {
    const payload = {
      ...formState.value,
      precoCustoProduto: Number(formState.value.precoCustoProduto) || 0,
      precoVendaProduto: Number(formState.value.precoVendaProduto) || 0,
      estoqueAtual: Number(formState.value.estoqueAtual) || 0,
    };

    if (isEditMode.value && props.product) {
      await productStore.updateProduct(props.product.id, payload as Partial<Produto>);
      message.success(`Produto "${payload.nomeProduto}" atualizado!`);
    } else {
      await productStore.addNewProduct(payload as Omit<Produto, 'id'>);
      message.success(`Produto "${payload.nomeProduto}" criado!`);
    }

    emit('saved');
    emit('close');
  } catch (err: any) {
    error.value = err.response?.data?.erro || 'Falha ao processar o produto.';
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  if (props.open) {
    populateForm();
  }
});
</script>