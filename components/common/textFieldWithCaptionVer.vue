<template>
  <v-row no-gutters>
    <v-col cols="12" class="text-left">
      <span class="captionText" :class="{ required: props.isRequired }">
        {{ props.caption }}
      </span>
    </v-col>
    <v-col cols="12">
      <v-text-field
        v-model="inputVal"
        class="inputField"
        bg-color="backgroundGray"
        :disabled="props.disabled"
        density="compact"
        variant="outlined"
        :clearable="clearable"
        clear-icon="mdi-close"
        :rules="props.rules"
        :hint="props.hint"
        persistent-hint
        :maxlength="props.maxLength"
        :validate-on="props.validateOn"
        :suffix="props.suffix"
        :placeholder="props.placeholder"
        persistent-placeholder
        :readonly="readOnly"
        @keydown.enter="handleEnter"
        @compositionstart="handleCompositionStart"
        @compositionend="handleCompositionEnd"
      />
    </v-col>
  </v-row>
</template>

<script setup>
const isComposition = ref(false); // 日本語入力中かどうかを判定

// v-modelの受け取り
const inputVal = defineModel("inputVal", {
  type: [String, null, Number],
  default: null,
});

const props = defineProps({
  caption: {
    type: String,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Array,
    default: [],
  },
  isRequired: {
    type: Boolean,
    default: false,
  },
  suffix: {
    type: String,
    default: "",
  },
  hint: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  validateOn: {
    type: String,
    default: "blur",
  },
  maxLength: {
    type: [Number, null],
    default: null,
  },
  enterEvent: {
    type: Function,
    default: null,
  },
  readOnly: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
});

function handleEnter(event) {
  if (isComposition.value) {
    event.preventDefault(); // 変換確定エンターを無視
    return;
  }

  if (!props.enterEvent) return;
  props.enterEvent();
}

function handleCompositionStart() {
  // 日本語入力が開始された時にフラグを立てる
  isComposition.value = true;
}

function handleCompositionEnd() {
  // 変換確定後に日本語入力が終了したことを検知
  isComposition.value = false;
}
</script>

<style>
.captionText {
  color: #0a0a0a;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
  padding: 0 0 0 0;
}
</style>
