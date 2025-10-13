import { defineVuetifyConfiguration } from "vuetify-nuxt-module/custom-configuration";
import { MAIN_THEME, mainTheme, mainDarkTheme } from "./helpers/themes";
import { defaults } from "./helpers/defaults";
import { ja } from "vuetify/locale";

export default defineVuetifyConfiguration({
  /* vuetify options */
  locale: {
    locale: "ja", // デフォルトロケールを日本語に設定
    fallback: "en", // フォールバック言語
    messages: { ja }, // 日本語ロケールを適用
  },
  defaults,
  display: {
    mobileBreakpoint: "sm",
  },
  icons: {
    defaultSet: "mdi",
    sets: ["mdi"],
  },
  // add theme
  theme: {
    defaultTheme: MAIN_THEME,
    themes: {
      mainTheme,
      mainDarkTheme,
    },
    // primary-darken-9 primary-lighten-9 までできるようにする
    variations: {
      colors: ["primary", "secondary", "accent"],
      lighten: 9,
      darken: 9,
    },
  },
});
