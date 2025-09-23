<template>
  <v-navigation-drawer v-model="drawer">
    <v-list nav dense>
      <template v-for="(item, i) in items" :key="i">
        <v-list-item
          v-if="!item.children"
          :to="item.to"
          link
        >
          <template #prepend>
            <v-icon>{{ item.icon }}</v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
        <v-list-group
          v-else
        >
            <template v-slot:activator="{ props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon>{{ item.icon }}</v-icon>
                </template>
              <v-list-item-title>{{ item.title }}</v-list-item-title>
            </v-list-item>
          </template>

          <v-list-item
            v-for="(child, j) in item.children"
            :key="j"
            :to="child.to"
            link
          >
            <template #prepend v-if="child.icon">
              <v-icon>{{ child.icon }}</v-icon>
            </template>
            <v-list-item-title>{{ child.title }}</v-list-item-title>
          </v-list-item>
        </v-list-group>
      </template>
    </v-list>
  </v-navigation-drawer>
  <v-app-bar :clipped-left="clipped" fixed app color="#12C646">
    <v-app-bar-nav-icon color="white" @click.stop="drawer = !drawer" />
    <v-toolbar-title class="text-white font-weight-bold" @click="goHome">
      幸座管理システム
    </v-toolbar-title>
    <v-spacer />
    <div v-if="displayLogout">
      <v-btn
        prepend-icon="mdi-logout"
        variant="text"
        color="white"
        @click.prevent="onClick"
      >
        <template v-slot:prepend>
          <v-icon color="white"></v-icon>
        </template>
        ログアウト
      </v-btn>
    </div>
  </v-app-bar>
</template>

<script setup>
import { VTreeview } from 'vuetify/labs/VTreeview'
const props = defineProps({
  items: {
    type: Array,
  },
  isLogin: {
    type: Boolean,
  },
  homeURL: {
    type: String,
  },
  onClick: {
    type: Function,
  },
});

const drawer = ref(false);
const clipped = ref(false);

// computed
const displayLogout = computed(() => {
  return props.isLogin;
});

//methods
function goHome() {
  navigateTo(props.homeURL);
}

</script>

<style lang="scss" scoped></style>
