// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['vuetify-nuxt-module', '@nuxtjs/supabase',"dayjs-nuxt"],
  runtimeConfig: {
    public: {
      BASE_URL: process.env.BASE_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  vuetify: {
    moduleOptions: {},
    vuetifyOptions: "./vuetify.config.ts",
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
    redirect: false,
  },
  dayjs: {
    locales: ["ja"],
    defaultLocale: "ja",
    plugins: ["relativeTime", "utc", "timezone"],
    defaultTimezone: "Asia/Tokyo",
  },
  vite: { 
    server: { 
      watch: { 
        usePolling: true, interval: 300 
      } 
    } ,
    optimizeDeps: {
      include: ["cookie"],
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "@/assets/styles/global/_font-family" as *; \
          @use "@/assets/styles/global/_color" as *; \
          @use "@/assets/styles/global/_function" as *; \
          @use "@/assets/styles/global/_mixin" as *; \
          @use "@/assets/styles/component/_component" as *;`,
        },
      },
    },
  },
})