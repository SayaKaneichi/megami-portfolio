<template>
  <div class="pa-4">
    <h2 class="mb-8">通知管理</h2>
    <!-- 通知カード -->
    <h4 class="mt-10 mb-2">リマインド</h4>
    <v-card class="my-4" outlined>
      <v-card-text class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon size="40" class="mr-3">mdi-clock</v-icon>
          <div>
            <div>参加前日の</div>
            <div class="text-h6">{{ reminder.time }}</div>
          </div>
        </div>
        <div class="d-flex align-center">
          <span class="mr-2">{{ reminder.enabled ? "有効" : "無効" }}</span>
          <v-btn
            icon
            variant="text"
            class="ma-0 pa-0"
            :ripple="false"
            @click="openDialog(reminder.notification_type)"
          >
            <v-icon size="20" color="green">mdi-pencil-outline</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <h4 class="mt-10 mb-2">空席情報の配信</h4>
    <v-card class="my-4" outlined>
      <v-card-text class="d-flex align-center justify-space-between">
        <div class="d-flex align-center">
          <v-icon size="40" class="mr-3">mdi-clock</v-icon>
          <div>
            <div>開催２日前の</div>
            <div class="text-h6">{{ vacancy.time }}</div>
            <div class="text-caption" v-if="Array.isArray(vacancy.target)">
              対象：
              {{
                venues
                  .filter((v) => vacancy.target.includes(v.id))
                  .map((v) => v.venue_name)
                  .join("、")
              }}
            </div>
          </div>
        </div>
        <div class="d-flex align-center">
          <span class="mr-2">{{ vacancy.enabled ? "有効" : "無効" }}</span>
          <v-btn
            icon
            variant="text"
            class="ma-0 pa-0"
            :ripple="false"
            @click="openDialog(vacancy.notification_type)"
          >
            <v-icon size="20" color="green">mdi-pencil-outline</v-icon>
          </v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- 編集ダイアログ -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <v-select
            label="通知時間を選択"
            :items="timeOptions"
            v-model="editData.time"
            class="mb-4"
          />

          <v-select
            v-if="editType === NOTIFICATION_TYPES.VACANCY_REMINDER"
            label="通知対象の会場を選択"
            :items="venues"
            item-title="venue_name"
            item-value="id"
            v-model="editData.target"
            multiple
            chips
            class="mb-4"
          />

          <div class="d-flex align-center mb-4">
            <span style="margin-right: 12px; font-weight: 500; color: #333">
              {{ editData.enabled ? "有効" : "無効" }}
            </span>
            <v-switch
              v-model="editData.enabled"
              color="#12C646"
              inset
              hide-details
              class="ma-0 pa-0"
            />
          </div>
        </v-card-text>

        <v-card-actions class="px-4 pb-4 pt-2 justify-center">
          <v-row dense no-gutters class="w-100" style="max-width: 300px">
            <v-col cols="6" class="pr-2">
              <v-btn block class="cancelBtn" @click="dialog = false">
                キャンセル
              </v-btn>
            </v-col>
            <v-col cols="6" class="pl-2">
              <v-btn block class="submitBtn" @click="updateNotification">
                保存する
              </v-btn>
            </v-col>
          </v-row>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- ローディングインジケーター -->
    <v-dialog v-model="isLoading" hide-overlay persistent origin="top left">
      <v-card color="primary" dark>
        <v-overlay
          :model-value="isLoading"
          persistent
          class="align-center justify-center"
        >
          <v-progress-circular indeterminate />
        </v-overlay>
      </v-card>
    </v-dialog>
    <InfoDialog color="primary" />
  </div>
</template>

<script setup>
import { useLoadingStore } from "~/composables/states";
import { useInfoStore } from "~/composables/info";
import InfoDialog from "~/components/infoDialog.vue";
import { NOTIFICATION_TYPES } from "~/utils/shared/notificationTypes.js";

const { state: loadingState } = useLoadingStore();

const nuxtApp = useNuxtApp();
const dialog = ref(false);
const editType = ref("");
const editData = ref({});
const venues = ref([]);
const reminder = ref({});
const vacancy = ref({});
const infoStore = useInfoStore();

onMounted(() => {
  useLoadingStore().setBeginLoaging();
  fetchVenues();
  fetchNotifications();
  useLoadingStore().setStopLoaging();
});

// 時間・会場リスト
const timeOptions = [
  "8:00",
  "9:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];
// 算出プロパティ
const isLoading = computed(() => {
  return loadingState.value.isLoading;
});

// ダイアログ操作
function openDialog(type) {
  editType.value = type;
  const baseData =
    type === NOTIFICATION_TYPES.EVENT_REMINDER ? reminder.value : vacancy.value;

  editData.value = {
    ...baseData,
    notification_type: type,
  };
  dialog.value = true;
}

const dialogTitle = computed(() =>
  editType.value === NOTIFICATION_TYPES.EVENT_REMINDER
    ? "リマインドの設定"
    : "空席情報の配信の設定"
);

//会場一覧の取得
async function fetchVenues() {
  try {
    const result = await nuxtApp.$httpsCallable("fetchVenues", {});
    venues.value = result.data?.res || [];
  } catch (error) {
    console.error("fetchVenues failed:", error);
    venues.value = [];
  }
}

//通知時間の取得
async function fetchNotifications() {
  try {
    const result = await nuxtApp.$httpsCallable("fetchNotifications", {});
    const rawData = result.data?.res || [];

    for (const item of rawData) {
      const formattedTime = item.notification_time.slice(0, 5);
      const base = {
        id: item.id,
        time: formattedTime,
        enabled: item.enabled,
        notification_type: item.notification_type,
      };

      if (item.notification_type === NOTIFICATION_TYPES.EVENT_REMINDER) {
        reminder.value = base;
      } else if (
        item.notification_type === NOTIFICATION_TYPES.VACANCY_REMINDER
      ) {
        const venueIds = await fetchVenueLinkage(item.notification_type);
        vacancy.value = {
          ...base,
          target: venueIds,
        };
      }
    }
  } catch (error) {
    console.error("fetchNotifications エラー:", error);
    window.alert("通知設定の取得に失敗しました。リロードしてください。");
  }
}

//通知時間と通知ON/OFF更新
async function updateNotification() {
  try {
    const formattedTime = formatToHHMMSS(editData.value.time);

    await nuxtApp.$httpsCallable("updateNotification", {
      time: formattedTime,
      enabled: editData.value.enabled,
      type: editData.value.notification_type,
    });

    if (editType.value === NOTIFICATION_TYPES.VACANCY_REMINDER) {
      await updateVenueLinkage();
    }

    infoStore.setInfoMessage("通知設定を変更しました");
    dialog.value = false;
    fetchNotifications();
  } catch (error) {
    console.error("updateNotification error:", error);
    window.alert("通知設定の保存に失敗しました。リロードしてください。");
  }
}

async function updateVenueLinkage() {
  try {
    useLoadingStore().setBeginLoaging();

    await nuxtApp.$httpsCallable("updateVenueLinkage", {
      notification_type: editData.value.notification_type,
      venueIds: editData.value.target || [],
    });
  } catch (error) {
    console.error("updateVenueLinkage error:", error);
    alert("会場の保存に失敗しました。リロードしてください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

//時間表示整形
function formatToHHMMSS(timeStr) {
  if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
    return timeStr + ":00"; // "9:00" → "9:00:00"
  }
  return timeStr; // すでに "HH:MM:SS" の場合
}

async function fetchVenueLinkage(notificationType) {
  try {
    const result = await nuxtApp.$httpsCallable("fetchVenueLinkage", {
      notification_type: notificationType,
    });
    return result.data.venueIds || [];
  } catch (error) {
    console.error("会場リンク取得エラー:", error);
    return [];
  }
}
</script>

<style scoped>
.cancelBtn {
  background-color: #9e9e9e !important;
  color: white !important;
  border: none !important;
}
.submitBtn {
  background-color: #2f7fbe !important;
  color: white !important;
  border: none !important;
}
</style>
