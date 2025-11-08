<template>
  <v-app>
    <MainHeader
      :isLogin="isLogin"
      :onClick="signout"
      :items="items"
      homeURL="/dashboard"
    />
    <v-main>
      <v-container class="mt-6 mt-md-8">
        <slot />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { useAuthStore } from "~/composables/states";

const { state: authState } = useAuthStore();
const user = useSupabaseUser();
const items = ref([]);

const isLogin = computed(() => {
  return authState.value.isLogin;
});

const id = computed(() => {
  return isLogin.value ? user.value.id : null;
});

async function signout() {
  const supabase = useSupabaseClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    // エラー時の処理
    window.alert("ログアウト処理に失敗しました。リロードしてください。");
  }
  // 未ログイン状態に変更
  useAuthStore().setLoginState(false);
  window.alert("ログアウトしました");
  await useRouter().push({ path: "/" });
}

items.value = [
  {
    icon: "mdi-account-group",
    title: "幸座管理",
    to: `/`,
  },
  {
    icon: "mdi-map-marker-radius",
    title: "会場管理",
    to: `/venue`,
  },
  {
    icon: "mdi-information-outline",
    title: '情報管理',
    children:
    [
      {
        icon: "mdi-account-group",
        title: "友だち管理",
        to: `/manage/friend`,
      },
      {
        icon: "mdi-tag",
        title: "タグ管理",
        to: `/manage/tag`,
      },
    ],
  },
  {
    icon: "mdi-chart-box",
    title: "データ分析",
    to: `/dataAnalysis`,
  },
  {
    icon: "mdi-bell-ring",
    title: "通知管理",
    to: `/notificationManage`,
  },
];
</script>
