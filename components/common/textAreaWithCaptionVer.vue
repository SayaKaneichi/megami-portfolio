<template>
  <v-row no-gutters>
    <v-col cols="12" class="text-left">
      <span class="captionText" :class="{ required: props.isRequired }">
        {{ props.caption }}
      </span>
    </v-col>
    <v-col cols="12">
      <v-textarea
        v-model="inputVal"
        class="inputField"
        bg-color="backgroundGrey"
        :disabled="props.disabled"
        density="compact"
        variant="outlined"
        :clearable="!props.readOnly"
        clear-icon="mdi-close"
        :rules="props.rules"
        :hint="props.hint"
        persistent-hint
        :maxlength="props.maxLength"
        :validate-on="props.validateOn"
        :suffix="props.suffix"
        :placeholder="props.placeholder"
        persistent-placeholder
        :counter="counter"
        :readonly="props.readOnly"
      />
    </v-col>
  </v-row>
</template>

<script setup>
// v-modelの受け取り
const inputVal = defineModel("inputVal", {
  type: [String, null],
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
  readOnly: {
    type: Boolean,
    default: false,
  },
});

const counter = computed(() => {
  return props.maxLength ?? false;
});
</script>

<style>
.captionText {
  color: #0a0a0a;
  font-size: 16px;
  font-weight: 500;
  text-align: left;
  padding: 0 0 0 0;
}
</style>
