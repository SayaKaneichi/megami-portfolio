<template>
  <v-app-bar :clipped-left="clipped" fixed app color="white">
    <v-btn
      @click="goBack"
      prepend-icon="mdi-chevron-left"
      class="font-weight-bold"
    >
      戻る
    </v-btn>
    <v-toolbar-title class="ml-5" style="font-size: 14px">
      {{ title }}
    </v-toolbar-title>
  </v-app-bar>
</template>

<script setup lang="ts">
const clipped = ref(false);
const router = useRouter();
const route = useRoute();
const title = ref("");

const pageMap: Record<string, { title: string }> = {
  reserveFromCalender: {
    title: "希望日時を選択してください",
  },
  reserveForm: {
    title: "お客様情報を入力してください",
  },
  reserveFromVenue: {
    title: "幸座を選んでください",
  },
};

function updateContentFromRoute(path: string) {
  const cleanPath = path.split("?")[0];
  const segments = cleanPath.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1] || "home";
  const page = pageMap[lastSegment];

  if (page) {
    title.value = page.title;
  } else {
    title.value = "";
  }
}

// ページ遷移時に内容更新
watch(
  () => route.fullPath,
  (newPath) => {
    updateContentFromRoute(newPath);
  },
  { immediate: true }
);

function goBack() {
  router.back();
}
</script>

<style lang="scss" scoped></style>
