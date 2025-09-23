<template>
  <v-row no-gutters>
    <v-col cols="12" class="text-left">
      <span class="captionText" :class="{ required: props.isRequired }">
        {{ props.caption }}
      </span>
    </v-col>
    <v-col cols="12">
      <v-select
        class="customSelect"
        bg-color="backgroundGray"
        v-model="selectValue"
        :items="itemData"
        :label="label"
        density="compact"
        variant="solo"
        :disabled="disabled"
        :placeholder="placeholder"
        :clearable="!props.readOnly"
        :readonly="props.readOnly"
      ></v-select>
    </v-col>
  </v-row>
</template>

<script setup>
const selectValue = defineModel("inputVal", {
  type: [String, Number], // 単一の値を扱う
  default: "",
});

const props = defineProps({
  caption: {
    type: String,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  captionCols: {
    type: Number,
    default: 3,
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  itemData: {
    type: Array,
    default: [],
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const inputCols = computed(() => {
  return 12 - props.captionCols;
});
</script>

<style scoped lang="scss">
.captionText {
  color: #0a0a0a;
  font-size: 16px;
  font-weight: 500;
  text-align: left;
  padding: 0 0 0 0;
}

.v-select {
  :deep(.v-input__control) {
    border: 1px solid #9e9e9e; /* 枠線の色と幅 */
    border-radius: 4px; /* 角丸 */
  }

  :deep(.v-field--variant-solo),
  :deep(.v-field--variant-solo-filled) {
    box-shadow: none !important; /* 影を削除 */
  }

  :deep(.v-label.v-field-label.v-field-label--floating) {
    font-size: 10px !important;
  }
}
</style>
