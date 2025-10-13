<template>
  <v-app>
    <v-app-bar :clipped-left="clipped" fixed color="#12C646">
      <v-app-bar-title class="text-white font-weight-bold">
        幸座管理システム
      </v-app-bar-title>
      <v-spacer />
    </v-app-bar>
    <v-main>
      <v-container
        fluid
        class="d-flex align-center justify-center"
        style="height: 100vh"
      >
        <slot />
      </v-container>
    </v-main>
    <v-footer :absolute="!fixed" app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
  </v-app>
</template>

<script setup>
const clipped = ref(false);
const fixed = ref(false);
</script>
