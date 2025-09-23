<script lang="ts">
import { defineComponent } from "vue";
import { useInfoStore } from "~/composables/info";

export default defineComponent({
  name: "InfoDialog",
  props: {
    color: {
      type: String,
      default: "success",
    },
  },
  setup() {
    const infoStore = useInfoStore();
    const { state } = infoStore;

    // ローカル変数
    let isDisplay = ref(false);

    // computed
    const message = computed(() => state.value.message);
    const existsInfoMessage = computed(() => infoStore.existsInfoMessage());

    // watcher
    watch(existsInfoMessage, (_current, _prev) => {
      isDisplay.value = existsInfoMessage.value;
    });
    watch(isDisplay, (_current, _prev) => {
      if (!isDisplay.value) {
        infoStore.clearInfoMessage();
      }
    });

    onMounted(() => {
      isDisplay.value = existsInfoMessage.value;
    });

    // methods

    return { isDisplay, message };
  },
});
</script>
<template>
  <v-snackbar
    v-model="isDisplay"
    transition="slide-y-transition"
    :color="color"
    rounded="sm"
    location="bottom"
  >
    <div class="d-flex flex-row justify-center">
      <span class="messageArea align-self-center">
        {{ message }}
      </span>
    </div>
  </v-snackbar>
</template>

<style lang="scss" scoped>
.messageArea {
  color: white;
  font-size: 14px;
}
</style>
