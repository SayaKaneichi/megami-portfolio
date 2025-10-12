<template>
  <v-container>
    <v-row class="align-center" justify="space-between">
      <v-col cols="12">
        <h2 class="mb-4">データ分析</h2>
      </v-col>
    </v-row>

    <v-row class="mt-4 align-center" dense>
      <v-col cols="2">
        <v-select
          :items="years"
          v-model="selectedYear"
          placeholder="年"
          variant="outlined"
          clearable
          @update:model-value="onYearChange"
        >
          <template #append-inner>
            <span v-if="selectedYear" class="text-grey-darken-1">年</span>
          </template>
        </v-select>
      </v-col>
      <v-col cols="2">
        <v-select
          :items="months"
          v-model="selectedMonth"
          placeholder="月"
          variant="outlined"
          clearable
          :disabled="!selectedYear"
        >
          <template #append-inner>
            <span v-if="selectedMonth" class="text-grey-darken-1">月</span>
          </template>
        </v-select>
      </v-col>
      <v-col cols="3">
        <v-select
          :items="venues"
          item-title="venue_name"
          item-value="id"
          v-model="selectedVenue"
          placeholder="会場"
          variant="outlined"
          style="min-width: 80px"
          clearable
        />
      </v-col>
      <v-col cols="1">
        <v-btn @click="filter()"> 絞り込む </v-btn>
      </v-col>
      <v-col cols="auto" style="margin-left: 80px; margin-top: 21px">
        <div class="d-flex align-center" style="gap: 16px">
          <div class="text-body-2">参加人数計：{{ totalParticipants }}人</div>
          <div class="text-body-2">入金：{{ totalAmount }}円</div>
        </div>
      </v-col>
    </v-row>

    <v-list
      class="customListWrapper mt-4"
      elevation="2"
      v-if="events.length > 0"
    >
      <!-- ヘッダー -->
      <div class="listRow headerRow">
        <div class="cell">開催日時</div>
        <div class="cell">会場</div>
        <div class="cell">参加員数</div>
        <div class="cell">金額</div>
      </div>
      <v-divider />

      <template v-if="filteredEvents.length > 0">
        <template v-for="(event, index) in filteredEvents" :key="event.id">
          <div class="listRow">
            <div class="cell font-weight-bold">{{ event.date }}</div>
            <div class="cell">{{ event.venue }}</div>
            <div class="cell">{{ event.reservationCount }}人</div>
            <div class="cell">{{ event.amount }}円</div>
          </div>
          <v-divider v-if="index !== event.length - 1" />
        </template>
      </template>
      <template v-else>
        <div class="listRow">
          <div class="cell text-center text-grey-darken-1" style="flex: 1">
            条件に一致するイベントはありません
          </div>
        </div>
      </template>
    </v-list>

    <p v-else class="text-center text-grey-darken-1 mt-4">データがありません</p>
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
  </v-container>
</template>

<script setup>
import { useLoadingStore } from "~/composables/states";
const { state: loadingState } = useLoadingStore();
const dayjs = useDayjs();
const nuxtApp = useNuxtApp();
const months = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const venues = ref([]);
const events = ref([]);
const selectedYear = ref(null);
const selectedMonth = ref(null);
const selectedVenue = ref(null);
const filteredEvents = ref([]);

//年は２０２５年スタートで蓄積。年を重ねるごとに増える。
const baseYear = 2025;
const currentYear = new Date().getFullYear();
const years = Array.from({ length: currentYear - baseYear + 1 }, (_, i) =>
  String(baseYear + i)
);

onMounted(() => {
  useLoadingStore().setBeginLoaging();
  initialize();
  fetchEvents();
  fetchVenues();
  useLoadingStore().setStopLoaging();
});

// 算出プロパティ
const isLoading = computed(() => {
  return loadingState.value.isLoading;
});

const totalParticipants = computed(() =>
  filteredEvents.value.reduce((sum, event) => {
    if (event.delete_flag) return sum; // 削除フラグが立っていたらスキップ
    return sum + Number(event.reservationCount || 0);
  }, 0)
);

const totalAmount = computed(() =>
  filteredEvents.value.reduce((sum, event) => {
    if (event.delete_flag) return sum; // 削除フラグが立っていたらスキップ
    const people = Number(event.reservationCount || 0);
    const fee = Number(event.amount || 0);
    return sum + people * fee;
  }, 0)
);

//イベント一覧の取得
async function fetchEvents() {
  try {
    const result = await nuxtApp.$httpsCallable("fetchEvents", {
      year: selectedYear.value,
      month: selectedMonth.value,
      venue: selectedVenue.value,
    });
    events.value = result.data.res.map((event) => ({
      id: event.id,
      date: formatDate(event.start_date),
      venue: event.venue_master.venue_name || "",
      reservationCount: event.reservation_count || 0,
      amount: event.registration_fee,
      delete_flag: event.delete_flag,
    }));

    function formatDate(rawDate) {
      const date = new Date(rawDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();

      return `${year}/${month}/${day}`;
    }
    filteredEvents.value = events.value;
  } catch (error) {
    console.error("Error fetching events:", error);
    window.alert(
      error.message || "イベントの取得に失敗しました。リロードしてください。"
    );
    return;
  }
}

//会場一覧の取得
async function fetchVenues() {
  try {
    const result = await nuxtApp.$httpsCallable("fetchVenues", {});
    venues.value = result.data?.res || [];
  } catch (error) {
    console.error("Error fetching venues:", error);
    window.alert(
      error.message || "会場の取得に失敗しました。リロードしてください。"
    );
    return;
  }
}

function filter() {
  if (!selectedYear.value && !selectedVenue.value) {
    window.alert("年または会場のいずれかを選択してください。");
    return;
  }
  try {
    useLoadingStore().setBeginLoaging();
    fetchEvents();
  } catch (error) {
    console.error("Error calling Cloud Function:", error);
    window.alert(
      error.message || "絞り込みに失敗しました。リロードしてください。"
    );
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

function initialize() {
  const currentDate = dayjs();
  const year = currentDate.year();
  const month = currentDate.month();
  const monthHumanReadable = month + 1; // 月は0から始まるため、1を足す
  selectedYear.value = String(year);
  selectedMonth.value = String(monthHumanReadable);
}

function onYearChange(value) {
  if (!value) {
    selectedMonth.value = null;
  }
}
</script>

<style scoped>
.customListWrapper {
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  padding: 0;
}

.listRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.headerRow {
  font-weight: bold;
  background-color: #12c646;
  color: white;
}

.cell {
  flex: 1;
  text-align: center;
}
</style>
