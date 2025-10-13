<!-- <template>
  <v-container class="pa-6">
    <v-btn color="primary">Hello Vuetify</v-btn>
  </v-container>

  <pre>{{ data }}</pre>
  
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { data, error } = await supabase
  .from('tag_master')
  .select()
  console.log(data)

  if(error){
      console.log(error)
    }
  
</script> -->


<template>
  <h2 class="c-heading-h2 text-indigo-darken-4">{{ displayMonth }}</h2>
  <div class="d-flex justify-end mt-1">
    <v-btn class="font-weight-bold" @click="addEvent()">幸座の追加</v-btn>
  </div>

  <div class="d-flex justify-space-between mt-4 mb-5 mt-md-8 mb-md-10">
    <button
      class="l-main__calendar-button text-blue-darken-4"
      @click="prevMonth"
    >
      前の月
    </button>
    <button
      class="l-main__calendar-button text-blue-darken-4"
      @click="nextMonth"
    >
      次の月
    </button>
  </div>
  <div class="l-main__calendar mx-auto">
    <div class="l-main__calendar-weekly">
      <div class="l-main__calendar-youbi" v-for="n in 7" :key="n">
        {{ youbi(n % 7) }}
      </div>
    </div>
    <div
      v-for="(week, index) in displayCalendar"
      :key="index"
      class="l-main__calendar-row"
    >
      <div
        v-for="(day, index) in week"
        :key="index"
        class="l-main__calendar-cell"
        :class="{ outside: currentMonth !== day.month }"
        @click="displayEventDetail(day)"
      >
        <div class="l-main__calendar-cell-day">{{ day.date }}</div>
        <div v-for="(dayEvent, index) in day.dayEvents" :key="index">
          <div
            class="l-main__calendar-cell-event font-weight-bold text-white"
            :style="`width:${dayEvent.width}%;background-color:${dayEvent.color}`"
          >
            {{ dayEvent.name }}
          </div>
        </div>
      </div>
    </div>
  </div>
  <v-slide-x-reverse-transition>
    <div v-if="drawer" class="d-flex mt-4 slideInBox">
      <v-row class="justify-center" no-gutters>
        <v-col cols="11" style="max-height: 80vh; overflow-y: scroll">
          <div class="text-black">
            {{ nuxtApp.$dayjs(selectedDate).format("M月DD日") }}
          </div>
          <v-card
            v-for="event in selectedDateEventList"
            :key="event.eventId"
            class="ma-4 pa-1 event__detail__card"
            :class="
              event.delete_flag
                ? 'bg-red-lighten-4'
                : event.publish
                  ? 'bg-orange-lighten-4'
                  : 'bg-grey-lighten-2'
            "
            @click="
              () => {
                if (!event.isPastEvent && !event.delete_flag) {
                  toEdit(event);
                }
              }
            "
          >
            <v-row class="pa-2 align-center" no-gutters>
              <v-col cols="10" class="d-flex flex-column justify-center">
                <div>{{ event.title }}</div>
                <div style="font-size: 12px" class="mt-1 align-center d-flex">
                  <v-icon class="mr-1">mdi-clock-time-five-outline</v-icon
                  >{{ event.eventStartAt }} -
                  {{ event.eventEndAt }}
                </div>
              </v-col>
              <v-col
                v-if="event.available && !event.isPastEvent"
                cols="2"
                class="event__detail__card__to__detail text-center justify-center"
              >
                <div>
                  <v-icon color="green" icon="mdi-pencil"></v-icon>
                </div>
              </v-col>
            </v-row>
            <v-row class="px-2 align-center" no-gutters>
              <v-col cols="10">
                <h4>参加者一覧</h4>
                <ul
                  v-if="event.guests && event.guests.length > 0"
                  class="noPadding my-1"
                >
                  <li v-for="(guest, index) in event.guests" :key="index">
                    <v-tooltip
                      v-if="guest.note"
                      :text="guest.note"
                      location="top"
                    >
                      <template #activator="{ props }">
                        <v-icon
                          v-bind="props"
                          color="green"
                          icon="mdi-comment-alert"
                        />
                      </template>
                    </v-tooltip>
                    {{ guest.display_name }}
                    <v-btn
                      x-small
                      variant="outlined"
                      density="compact"
                      :min-width="28"
                      class="ma-0 pa-0 bg-red"
                      color="white"
                      @click.stop="cancelParticipant(event, guest)"
                    >
                      <v-icon size="1.2rem">mdi-account-cancel-outline</v-icon>
                    </v-btn>
                  </li>
                </ul>
                <span v-else> 現在申し込みはありません </span>
                <div v-if="!event.delete_flag">
                  <v-btn
                    x-small
                    variant="outlined"
                    density="compact"
                    :min-width="28"
                    class="ma-0 pa-0"
                    color="teal-darken-1"
                    @click.stop="addParticipant(event)"
                  >
                    <v-icon size="1rem">mdi-account-plus</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
      <v-row no-gutters style="position: absolute; bottom: 10px; left: 5px">
        <v-col cols="12" class="d-flex justify-start">
          <v-btn color="black" variant="text" @click="drawer = !drawer">
            <v-icon size="2rem">mdi-chevron-right</v-icon>
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </v-slide-x-reverse-transition>

  <!-- 幸座追加ダイアログ -->
  <v-dialog v-model="dialog" max-width="500px" persistent>
    <v-card>
      <v-card-title>
        <span>{{ isEditMode ? "幸座の編集" : "幸座の追加" }}</span>
      </v-card-title>

      <v-card-text class="px-6 pt-4 pb-2">
        <v-form @submit.prevent="submitForm">
          <v-col>
            <v-combobox
              v-model="formData.venue"
              class="mb-4"
              label="会場を選択"
              :items="venues"
              item-title="venue_name"
              item-value="id"
              variant="outlined"
              clearable
              :rules="[required]"
            />

            <v-text-field
              class="mb-4"
              label="住所を入力"
              v-model="formData.address"
              :rules="[required]"
            />

            <v-row class="mb-2">
              <v-col cols="6">
                <v-menu
                  v-model="isStartDateMenu"
                  :close-on-content-click="false"
                >
                  <template #title>
                    <div />
                  </template>
                  <template #activator="{ props }">
                    <v-text-field
                      :model-value="formattedDateStart"
                      label="日付を選択"
                      readonly
                      v-bind="props"
                      :rules="[required]"
                      hide-details
                      density="compact"
                      variant="outlined"
                      prepend-inner-icon="mdi-calendar"
                      clearable
                    />
                  </template>
                  <v-locale-provider locale="ja">
                    <v-date-picker
                      v-model="formData.startDate"
                      hide-actions
                      title=""
                      color="primary"
                      @update:model-value="isStartDateMenu = false"
                      first-day-of-week="1"
                    >
                      <template v-slot:header />
                    </v-date-picker>
                  </v-locale-provider>
                </v-menu>
              </v-col>
              <v-col cols="6">
                <v-select
                  label="開始時間を選択"
                  :items="times"
                  v-model="formData.startTime"
                  clearable
                  :rules="[required]"
                  @update:menu="onStartDateMenuUpdate"
                />
              </v-col>
            </v-row>

            <v-row class="mb-2">
              <v-col cols="6">
                <v-menu v-model="isEndDateMenu" :close-on-content-click="false">
                  <template #title>
                    <div />
                  </template>
                  <template #activator="{ props }">
                    <v-text-field
                      v-model="formattedDateEnd"
                      label="日付を選択"
                      readonly
                      v-bind="props"
                      :rules="[required]"
                      hide-details
                      density="compact"
                      variant="outlined"
                      prepend-inner-icon="mdi-calendar"
                      clearable
                    />
                  </template>
                  <v-locale-provider locale="ja">
                    <v-date-picker
                      v-model="formData.endDate"
                      hide-actions
                      title=""
                      color="primary"
                      @update:model-value="isEndDateMenu = false"
                      first-day-of-week="1"
                    >
                      <template v-slot:header />
                    </v-date-picker>
                  </v-locale-provider>
                </v-menu>
              </v-col>
              <v-col cols="6">
                <v-select
                  label="終了時間を選択"
                  :items="times"
                  v-model="formData.endTime"
                  clearable
                  :rules="[required]"
                  @update:menu="onEndDateMenuUpdate"
                />
              </v-col>
            </v-row>

            <v-text-field
              class="mb-4"
              label="参加人数上限を入力"
              v-model="formData.capacity"
              :rules="[required, isHalfWidthNumber]"
              maxlength="6"
            />

            <v-text-field
              class="mb-4"
              label="参加費を入力"
              v-model="formData.fee"
              :rules="[required, isHalfWidthNumber]"
              maxlength="7"
            />

            <v-checkbox
              class="mb-4"
              :label="publishLabel"
              v-model="formData.isPublished"
              :disabled="isPublishLocked"
            />
          </v-col>

          <v-card-actions class="px-4 pb-4 pt-2">
            <v-row dense no-gutters class="w-100">
              <v-col cols="4" class="pr-2">
                <v-btn block class="cancelBtn" @click="closeModal">
                  キャンセル
                </v-btn>
              </v-col>

              <v-col cols="4" class="px-1">
                <v-btn
                  block
                  class="cancelEventBtn"
                  @click="cancelEvent"
                  v-show="isEditMode"
                >
                  中止する
                </v-btn>
              </v-col>

              <v-col cols="4" class="pl-2">
                <v-btn block class="submitBtn" @click="submitForm">
                  {{ isEditMode ? "保存する" : "登録する" }}
                </v-btn>
              </v-col>
            </v-row>
          </v-card-actions>
        </v-form>
      </v-card-text>
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
  <v-dialog
    v-model="isParticipantMamageOpen"
    style="z-index: 110"
    max-width="500px"
    persistent
  >
    <v-card class="pa-4">
      <v-card-title class="d-flex">
        <span>参加者管理</span>
        <v-spacer />
        <v-btn
          variant="plain"
          width="20px"
          height="20px"
          icon
          @click="closeParticipantManage"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-card-text>
        <CommonTextFieldWithCaptionVer
          v-model:inputVal="participantMamage.venue"
          caption="選択した幸座"
          :maxLength="50"
          :readOnly="true"
          :clearable="false"
        />
        <CommonTextFieldWithCaptionVer
          class="mt-2"
          v-model:inputVal="displayEventDateTime"
          caption="選択した日時"
          :maxLength="100"
          :readOnly="true"
          :clearable="false"
        />
        <CommonTextFieldWithCaptionVer
          class="mt-2"
          v-model:inputVal="participantMamage.registration_fee"
          caption="幸座料金"
          :maxLength="100"
          :readOnly="true"
          :clearable="false"
          suffix="円"
        />
        <v-row no-gutters class="mt-4">
          <v-col cols="12" class="text-left">
            <h3>お客様情報</h3>
          </v-col>
        </v-row>
        <CommonSelectWithCaptionVer
          class="mt-2"
          v-model:inputVal="participantMamage.user_id"
          caption="お名前"
          :required="true"
          :rules="[validationRules.required]"
          :itemData="notJoinedList"
          :readOnly="participantMamage.isReserved"
        />
        <CommonTextAreaWithCaptionVer
          class="mt-2"
          v-model:inputVal="participantMamage.note"
          caption="備考"
          :maxLength="300"
          :readOnly="participantMamage.isReserved"
        />
      </v-card-text>
      <v-card-actions class="d-flex justify-center align-center">
        <v-btn
          v-if="participantMamage.isReserved"
          variant="flat"
          color="red"
          :disabled="isLoading"
          width="200px"
          @click="toConfirmCancel()"
        >
          キャンセル
        </v-btn>
        <v-btn
          v-else
          variant="text"
          width="auto"
          :disabled="!canFormSubmit"
          class="lineStyleButton"
          @click.prevent="registerConfirm()"
        >
          登録する
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <InfoDialog color="primary" />
</template>

<script setup>
import { useLoadingStore } from "~/composables/states";
import { useInfoStore } from "~/composables/info";
import InfoDialog from "~/components/infoDialog.vue";
import { validationRules } from "~/utils/validationRules";

const nuxtApp = useNuxtApp();
const dayjs = useDayjs();
const currentDate = ref(dayjs());
const events = ref([]);
const selectedDateEventList = ref([]);
const selectedDate = ref("");
const displayCalendar = ref([]);
const drawer = ref(false);
const dialog = ref(false);
const venues = ref([]);
const isEditMode = ref(false);
const isStartDateMenu = ref(false);
const isEndDateMenu = ref(false);
const wasPublished = ref(false);
const infoStore = useInfoStore();
const formData = ref({
  eventId: null,
  venue: null,
  address: "",
  startDate: "",
  startTime: null,
  endDate: "",
  endTime: null,
  eventEndAtTime: null,
  capacity: "",
  fee: "",
  isPublished: false,
});
const isParticipantMamageOpen = ref(false);
const { state: loadingState } = useLoadingStore();
const initilaFormData = {
  event_id: null,
  venue: "",
  eventStartAt: null,
  eventEndAt: null,
  user_id: null,
  name: "",
  registration_fee: null,
  note: "",
  reserve_id: null,
  guests: [],
  isReserved: null,
};
const participantMamage = ref({ ...initilaFormData });
const notJoinedList = ref([]);
const memberList = ref([]);

onMounted(async () => {
  useLoadingStore().setBeginLoaging();
  await getAllEvents();
  getCalendar();
  await fetchVenues();
  await fetchMember();
  useLoadingStore().setStopLoaging();
});

// 算出プロパティ
const isLoading = computed(() => {
  return loadingState.value.isLoading;
});

const publishLabel = computed(() => {
  return isEditMode.value ? "公開する" : "すぐに公開";
});

const displayMonth = computed(() => currentDate.value.format("YYYY年MM月"));
const currentMonth = computed(() => currentDate.value.format("YYYY-MM"));

const sortedEvents = computed(() => {
  return events.value.slice().sort((a, b) => {
    const startDate = dayjs(a.start).format("YYYY-MM-DD");
    const startEndDate = dayjs(b.start).format("YYYY-MM-DD");
    if (startDate < startEndDate) return -1;
    if (startDate > startEndDate) return 1;
    return 0;
  });
});

const formattedDateStart = computed(() => {
  return formData.value.startDate
    ? formData.value.startDate.toLocaleDateString("ja-JP")
    : "";
});

const formattedDateEnd = computed(() => {
  return formData.value.endDate
    ? formData.value.endDate.toLocaleDateString("ja-JP")
    : "";
});

const displayEventDateTime = computed(() => {
  return participantMamage.value?.isSameDay
    ? `${participantMamage.value?.eventStartAt || ""} - ${participantMamage.value?.eventEndAtTime || ""}`
    : `${participantMamage.value?.eventStartAt || ""} - ${participantMamage.value?.eventEndAt || ""}`;
});

const canFormSubmit = computed(() => {
  return !!participantMamage.value.user_id;
});

// function
async function displayEventDetail(value) {
  drawer.value = !drawer.value;
  try {
    useLoadingStore().setBeginLoaging();

    const scopedSelectedDate = `${value.month}-${value.date.toString().padStart(2, "0")}`;
    const selectedDay = nuxtApp
      .$dayjs(scopedSelectedDate)
      .tz("Asia/Tokyo")
      .format("YYYY-MM-DD");

    // UTCとしてAPIに渡す日付（00:00:00 〜 23:59:59 UTC）
    const date = nuxtApp
      .$dayjs(selectedDay)
      .utc()
      .format("YYYY-MM-DD HH:mm:ss.SSSSSS");
    const nextDate = nuxtApp
      .$dayjs(date)
      .add(1, "day")
      .format("YYYY-MM-DD HH:mm:ss.SSSSSS");

    const result = await nuxtApp.$httpsCallable("getEventsOfTheDay", {
      date,
      nextDate,
    });

    // JSTで日付一致するデータだけにフィルタリング
    selectedDateEventList.value = result.data.res
      .filter((v) => {
        const eventStart = nuxtApp
          .$dayjs(v.start_date)
          .tz("Asia/Tokyo")
          .format("YYYY-MM-DD");
        return eventStart === selectedDay;
      })
      .map((v) => {
        return {
          title: v.venue_name,
          venueId: v.venue_id,
          eventId: v.id,
          start: nuxtApp.$dayjs(v.start_date).tz("Asia/Tokyo"),
          end: nuxtApp.$dayjs(v.end_date).tz("Asia/Tokyo"),
          address: v.venue_address,
          participants_limit: v.participants_limit,
          registration_fee: v.registration_fee,
          publish: v.publish,
          delete_flag: v.delete_flag,
          eventStartAt: nuxtApp
            .$dayjs(v.start_date)
            .tz("Asia/Tokyo")
            .format("MM/DD(dd)HH:mm"),
          eventStartAtDay: nuxtApp
            .$dayjs(v.start_date)
            .tz("Asia/Tokyo")
            .format("DD"),
          eventStartAtDate: nuxtApp
            .$dayjs(v.start_date)
            .tz("Asia/Tokyo")
            .format("dd"),
          eventEndAt: nuxtApp
            .$dayjs(v.end_date)
            .tz("Asia/Tokyo")
            .format("MM/DD(dd)HH:mm"),
          eventEndAtDay: nuxtApp
            .$dayjs(v.end_date)
            .tz("Asia/Tokyo")
            .format("DD"),
          eventEndAtDate: nuxtApp
            .$dayjs(v.end_date)
            .tz("Asia/Tokyo")
            .format("dd"),
          eventEndAtTime: nuxtApp
            .$dayjs(v.end_date)
            .tz("Asia/Tokyo")
            .format("HH:mm"),
          isSameDay:
            nuxtApp
              .$dayjs(v.start_date)
              .tz("Asia/Tokyo")
              .format("YYYY-MM-DD") ===
            nuxtApp.$dayjs(v.end_date).tz("Asia/Tokyo").format("YYYY-MM-DD"),
          available: v.participants_limit - v.reserve_count > 0,
          isPastEvent: nuxtApp
            .$dayjs(v.start_date)
            .tz("Asia/Tokyo")
            .startOf("day")
            .isBefore(nuxtApp.$dayjs().tz("Asia/Tokyo").startOf("day")),
          guests: v.guest_infos || [],
          reserve_id: v.reserve_id || null,
        };
      })
      .sort((a, b) => a.start.diff(b.start));

    selectedDate.value = selectedDay;
  } catch (error) {
    console.error("Error calling Cloud Function:", error);
    window.alert(error.message || "イベントの取得に失敗しました");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

// supabaseから幸座情報を取得して指定の連想配列に整形する関数
async function getAllEvents() {
  events.value = [];
  try {
    // console.log("targetVenueId", props.targetVenueId);
    const result = await nuxtApp.$httpsCallable("fetchAllEvents", {});
    // console.log("### L215", result.data);

    result.data.res.forEach((event) => {
      const start = dayjs(event.start_date).tz("Asia/Tokyo").toDate();
      const end = dayjs(event.end_date).tz("Asia/Tokyo").toDate();
      // 中止は赤、未公開は灰色、その他はオレンジ
      const barColor = event.delete_flag
        ? "red"
        : event.publish
          ? "orange"
          : "gray";
      events.value.push({
        id: event.id,
        venue_id: event.venue_id,
        name: event.venue_master.venue_name,
        start,
        end,
        participants_limit: event.participants_limit,
        registration_fee: event.registration_fee,
        publish: event.publish,
        delete_flag: event.delete_flag,
        color: barColor,
      });
    });
  } catch (error) {
    console.error("Error calling Cloud Function:", error);
    window.alert(error.message || "イベント一覧の取得に失敗しました");
  }
}

function getStartDate() {
  const date = dayjs(currentDate.value).startOf("month");
  const youbiNum = date.day();
  // 月曜始まりの調整（日曜だったら6日前、それ以外は youbiNum - 1 日前）
  return date.subtract(youbiNum === 0 ? 6 : youbiNum - 1, "day");
}

function getEndDate() {
  const date = dayjs(currentDate.value).endOf("month");
  const youbiNum = date.day(); // 0（日）～6（土）

  // 月曜始まり → 日曜終わりにしたいので、(youbiNum === 0) のときはそのまま、
  // それ以外は 7 - youbiNum を足す
  return date.add(youbiNum === 0 ? 0 : 7 - youbiNum, "day");
}

function getDayEvents(date, day) {
  let dayEvents = [];
  let startedEvents = [];
  sortedEvents.value.forEach((event) => {
    let startDate = dayjs(event.start).format("YYYY-MM-DD");
    let endDate = dayjs(event.end).format("YYYY-MM-DD");
    let Date = date.format("YYYY-MM-DD");
    if (startDate <= Date && endDate >= Date) {
      if (startDate === Date) {
        let width = getEventWidth(startDate, endDate, day);
        dayEvents.push({ ...event, width });
      } else if (day === 0) {
        let width = getEventWidth(date, endDate, day);
        dayEvents.push({ ...event, width });
      } else {
        startedEvents.push(event);
      }
    }
  });
  return dayEvents;
}

function getEventWidth(start, end, day) {
  const betweenDays = dayjs(end).diff(dayjs(start), "days"); // 日数の差
  if (betweenDays > 6 - day) {
    return (6 - day) * 100 + 90;
  } else {
    return betweenDays * 100 + 90;
  }
}

function getCalendar() {
  let calendars = [];
  let calendarDate = getStartDate();
  const endDate = getEndDate();
  const weekNumber = Math.ceil(endDate.diff(calendarDate, "days") / 7);
  for (let week = 0; week < weekNumber; week++) {
    let weekRow = [];
    for (let day = 0; day < 7; day++) {
      let dayEvents = getDayEvents(calendarDate, day);
      weekRow.push({
        date: calendarDate.get("date"),
        month: calendarDate.format("YYYY-MM"),
        dayEvents,
      });
      calendarDate = calendarDate.add(1, "day");
    }
    calendars.push(weekRow);
  }
  displayCalendar.value = calendars;
}

function nextMonth() {
  currentDate.value = dayjs(currentDate.value).add(1, "month"); // 1ヶ月進める
  getCalendar(); // カレンダー更新処理
}

function prevMonth() {
  currentDate.value = dayjs(currentDate.value).subtract(1, "month"); // 1ヶ月戻す
  getCalendar(); // カレンダー更新処理
}

function youbi(dayIndex) {
  const week = ["日", "月", "火", "水", "木", "金", "土"];
  return week[dayIndex];
}

//会場一覧の取得
async function fetchVenues() {
  const result = await nuxtApp.$httpsCallable("fetchVenues", {});
  venues.value = result.data?.res || [];
}

//幸座追加ダイアログ
function addEvent() {
  dialog.value = true;
}

//幸座編集ダイアログ
function toEdit(event) {
  if (event.isPastEvent || event.delete_flag) return; // ← 二重ガード

  isEditMode.value = true;
  dialog.value = true;

  wasPublished.value = event.publish === true;

  const start = event.start;
  const end = event.end;

  formData.value = {
    eventId: event.eventId,
    venue: {
      id: event.venueId,
      venue_name: event.title,
    },
    address: event.address ?? "",

    //日付（時間はセットしない）
    startDate: start ? dayjs(start).startOf("day").toDate() : "",
    endDate: end ? dayjs(end).startOf("day").toDate() : "",

    //時間（"HH:mm"形式）
    startTime: start ? dayjs(start).format("HH:mm") : "",
    endTime: end ? dayjs(end).format("HH:mm") : "",

    capacity:
      event.participants_limit != null ? String(event.participants_limit) : "",
    fee: event.registration_fee != null ? String(event.registration_fee) : "",
    isPublished: event.publish ?? false,
    isNewVenue: false,
  };
}

const required = (v) => !!v || "入力してください";
const isHalfWidthNumber = (v) => {
  const regex = /^(0|[1-9][0-9]*)$/;
  return regex.test(v) || "先頭に0をつけない半角数字で入力してください";
};

function closeModal() {
  formData.value = {
    venue: null,
    address: "",
    startDate: "",
    startTime: null,
    endDate: "",
    endTime: null,
    capacity: "",
    fee: "",
    isPublished: false,
    isNewVenue: false,
  };
  isEditMode.value = false;
  dialog.value = false;
}

function combineDateAndTime(date, timeStr) {
  if (!date || !timeStr) return null;

  const [hours, minutes] = timeStr.split(":").map(Number);

  return dayjs(date)
    .tz("Asia/Tokyo")
    .hour(hours)
    .minute(minutes)
    .second(0)
    .millisecond(0)
    .toISOString();
}

async function submitForm() {
  if (
    !formData.value.venue ||
    !formData.value.address ||
    !formData.value.startDate ||
    !formData.value.startTime ||
    !formData.value.endDate ||
    !formData.value.endTime ||
    !formData.value.capacity ||
    !formData.value.fee
  ) {
    window.alert("全ての項目を入力してください");
    return;
  }
  const startDate = combineDateAndTime(
    formData.value.startDate,
    formData.value.startTime
  );
  const endDate = combineDateAndTime(
    formData.value.endDate,
    formData.value.endTime
  );
  if (dayjs(startDate).isAfter(dayjs(endDate))) {
    window.alert("開始日時は終了日時より前を設定してください");
    return;
  }
  let venueId;

  if (formData.value.isNewVenue) {
    // 会場が新規入力 → 会場を先に登録
    const newVenue = await createVenue(
      formData.value.venue,
      formData.value.address
    );
    if (!newVenue) {
      alert("会場の登録に失敗しました");
      return;
    }
    venueId = newVenue.id;
  } else {
    venueId = formData.value.venue.id;
  }
  const eventData = {
    id: formData.value.eventId, //update用
    venue_id: venueId,
    start_date: startDate,
    end_date: endDate,
    participants_limit: Number(formData.value.capacity),
    registration_fee: parseInt(formData.value.fee.replace(/[^\d]/g, "")),
    publish: formData.value.isPublished,
  };

  if (isEditMode.value) {
    await updateEvent(eventData);
  } else {
    await insertEvent(eventData);
  }
  fetchVenues();
  dialog.value = false;
  drawer.value = false;
}

// イベントの登録
const insertEvent = async (eventData) => {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("createEvent", eventData);

    infoStore.setInfoMessage("イベントを登録しました");
    closeModal();
    await getAllEvents();
    getCalendar();
  } catch (error) {
    window.alert("イベント登録に失敗しました。もう一度お試しください。");
    console.error(error);
  } finally {
    useLoadingStore().setStopLoaging();
  }
};

// イベントの更新
const updateEvent = async (eventData) => {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("updateEvent", eventData);

    infoStore.setInfoMessage("イベント内容を変更しました");
    dialog.value = false;
    await getAllEvents();
    getCalendar();
  } catch (error) {
    window.alert("イベント更新に失敗しました。もう一度お試しください。");
    console.error(error);
  } finally {
    useLoadingStore().setStopLoaging();
  }
};
//イベント中止
async function cancelEvent() {
  if (!formData.value.eventId) {
    alert("イベントIDが見つかりません");
    return;
  }

  const confirmCancel = confirm("このイベントを中止にしますか？");
  if (!confirmCancel) return;

  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("cancelEvent", {
      id: formData.value.eventId,
    });

    alert("イベントを中止しました");
    dialog.value = false;
    drawer.value = false;
    await getAllEvents();
    getCalendar();
  } catch (error) {
    console.error(error);
    alert("中止処理に失敗しました");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

const createVenue = async (venueName, venueAddress) => {
  const result = await nuxtApp.$httpsCallable("createVenue", {
    venue_name: venueName,
    venue_address: venueAddress,
  });

  return result.data?.venue;
};

watch(
  () => formData.value.startDate,
  (newDate, oldDate) => {
    if (newDate !== oldDate) {
      formData.value.endDate = newDate;
    }
  }
);
watch(
  () => formData.value.venue,
  (newVenue) => {
    if (newVenue && typeof newVenue === "object") {
      const matched = venues.value.find(
        (v) => v.venue_name === newVenue.venue_name
      );
      formData.value.address = matched?.venue_address ?? "";
      formData.value.isNewVenue = !matched;
    } else {
      formData.value.address = "";
      formData.value.isNewVenue = true;
    }
  }
);

//時間15分刻み
const times = Array.from({ length: 24 * 4 }, (_, i) => {
  const hours = Math.floor(i / 4);
  const minutes = (i % 4) * 15;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
});

//公開・非公開のチェックフラグ
const isPublishLocked = computed(() => {
  return isEditMode.value && wasPublished.value;
});

// ドロップダウン開いたときに12:00にスクロール
async function onStartDateMenuUpdate(isOpen) {
  if (isOpen && !formData.value.startTime) {
    formData.value.startTime = "12:00"; // デフォルト値を設定
    await nextTick();
    // 次のイベントループでリセット（クリア）する
    setTimeout(() => {
      formData.value.startTime = null;
    }, 0);
  }
}

async function onEndDateMenuUpdate(isOpen) {
  if (isOpen && !formData.value.endTime) {
    formData.value.endTime = "12:00"; // デフォルト値を設定
    await nextTick();
    // 次のイベントループでリセット（クリア）する
    setTimeout(() => {
      formData.value.endTime = null;
    }, 0);
  }
}

function addParticipant(event) {
  participantMamage.value = {
    ...initilaFormData,
    venue: event.title,
    eventStartAt: event.eventStartAt,
    eventEndAt: event.eventEndAt,
    registration_fee: event.registration_fee,
    isReserved: false,
    event_id: event.eventId,
  };
  notJoinedList.value = memberList.value.filter(
    (member) => !event.guests.some((v) => v.user_id === member.value)
  );

  isParticipantMamageOpen.value = true;
}

function closeParticipantManage() {
  participantMamage.value = { ...initilaFormData };
  isParticipantMamageOpen.value = false;
}

//友達一覧を取得
async function fetchMember() {
  try {
    useLoadingStore().setBeginLoaging();
    const result = await nuxtApp.$httpsCallable("getMember", {});
    memberList.value = result.data.res.map((member) => ({
      value: member.user_id,
      title: member.display_name,
    }));
  } catch (error) {
    console.error("fetchMember:", error);
    window.alert("友だちの取得に失敗しました。リロードしてください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

async function registerConfirm() {
  try {
    useLoadingStore().setBeginLoaging();
    const name = memberList.value.find(
      (member) => member.value === participantMamage.value.user_id
    ).title;
    const confirmText = `以下の内容で登録します。よろしいですか？
    幸座名：${participantMamage.value.venue}
    日時：${displayEventDateTime.value}
    料金：${participantMamage.value.registration_fee}
    お名前：${name}
    備考：${participantMamage.value.note}`;
    if (confirm(confirmText)) {
      const params = {
        event_id: participantMamage.value.event_id,
        guest_id: participantMamage.value.user_id,
        name: name,
        note: participantMamage.value.note,
      };

      await nuxtApp.$httpsCallable("toReserve", params);
      // console.log(result.data.res.id);

      infoStore.setInfoMessage("登録が正常に完了しました");
      closeParticipantManage();
      drawer.value = false;
    }
  } catch (error) {
    console.error("Error calling Cloud Function:", error);
    window.alert(error.message || "予約に失敗しました");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

function cancelParticipant(event, guest) {
  participantMamage.value = {
    ...initilaFormData,
    venue: event.title,
    eventStartAt: event.eventStartAt,
    eventEndAt: event.eventEndAt,
    registration_fee: event.registration_fee,
    isReserved: true,
    event_id: event.eventId,
    user_id: guest.user_id,
    note: guest.note || "",
    reserve_id: event.reserve_id || null,
  };
  notJoinedList.value = memberList.value;

  isParticipantMamageOpen.value = true;
}

async function toConfirmCancel() {
  try {
    const confirmCancel = confirm("キャンセル扱いにしてよろしいですか？");
    if (!confirmCancel) return;

    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("toCancel", {
      targetEventId: participantMamage.value.event_id,
      reserveId: participantMamage.value.reserve_id,
      userId: participantMamage.value.user_id,
    });
    infoStore.setInfoMessage("キャンセルしました");
    closeParticipantManage();
    drawer.value = false;
  } catch (err) {
    window.alert("キャンセルに失敗しました。再度試してください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}
</script>

<style scoped lang="scss">
@use "@/assets/styles/global/mixin" as mixin;

.l-main__calendar {
  max-width: 900px;

  &-button {
    font-size: 14px;
  }

  &-weekly,
  &-row {
    display: flex;
    border-left: 1px solid $c-gray;
  }

  &-weekly {
    border-top: 1px solid $c-gray;
    border-bottom: 1px solid rgba($c-gray, 1);
  }

  &-youbi {
    flex: 1;
    font-size: 14px;
    text-align: center;
    border-right: 1px solid $c-gray;
    padding: 0.25em 0;
    width: calc(100% / 7);
  }

  &-cell {
    font-size: 14px;
    text-align: center;
    flex: 1;
    min-height: 90px;
    border-right: 1px solid $c-gray;
    border-bottom: 1px solid $c-gray;
    padding-top: 0.1rem;
    width: calc(100% / 7);

    @include mixin.mq(md) {
      min-height: 130px;
      padding-top: 1rem;
    }

    &.outside {
      background-color: $c-gray-darker;
    }
    &:hover {
      box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.25);
      transform: translateY(-0.1875em);
      cursor: pointer;
    }
  }

  &-cell-day {
    margin-bottom: 0.1em;
    font-size: 12px;
  }

  &-cell-event {
    display: -webkit-box;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-all;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    position: relative;
    border-radius: 8px;
    margin: 0 0 0.5em 5%;
    padding: 1px 4px;

    @include mixin.mq(sm, max) {
      font-size: 10px;
    }
  }
}

.event__detail__card {
  &-to-detail {
    margin: 0 0 0 auto;
    padding-right: 4px;
  }

  &:hover {
    box-shadow: 0 3px 6px 0 rgba(0, 0, 0, 0.25);
    transform: translateY(-0.1875em);
    cursor: pointer;
  }
}

.event__detail__card__to__detail {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-weight: bold;
  height: 2rem;
}

.event__detail__card__not_available {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  font-size: 10px;
  font-weight: bold;
  border: black solid 1px;
  border-radius: 5px;
  background-color: lightgray;
  height: 2rem;
  color: black;
}

.slideInBox {
  position: fixed;
  flex-direction: column;
  top: 40px;
  right: 0;
  width: 40%;
  height: 90vh;
  padding: 20px;
  background-color: white;
  color: white;
  box-shadow: -4px 0 10px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.cancelBtn {
  background-color: #9e9e9e !important;
  color: white !important;
  border: none !important;
}

.submitBtn {
  background-color: #2f7fbe !important; /* 濃いブルー */
  color: white !important;
  border: none !important;
}

.cancelEventBtn {
  background-color: #e53935 !important; /* 明確なレッド */
  color: white !important;
  border: none !important;
}

.noPadding {
  margin: 0;
  padding-left: 0;
  list-style-position: inside;
}
</style>
