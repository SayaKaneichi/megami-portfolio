<template>
  <h2 class="c-heading-h2 text-indigo-darken-4">{{ displayMonth }}</h2>
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
  <div
    v-show="selectedDateEventList.length > 0"
    class="mt-4"
    id="detail-container"
  >
    <v-card
      v-for="event in selectedDateEventList"
      :key="event.eventId"
      class="mt-4 event__detail__card"
      @click="toReserve(event)"
    >
      <v-row class="pa-4 align-center" no-gutters>
        <v-col cols="2" class="d-flex flex-column text-center">
          <div>
            <div>{{ event.eventStartAtDay }}</div>
            <div style="font-size: 12px">
              {{ event.eventStartAtDate }}
            </div>
          </div>
          <div v-if="!event.isSameDay">/</div>
          <div v-if="!event.isSameDay">
            <div>{{ event.eventEndAtDay }}</div>
            <div style="font-size: 12px">{{ event.eventEndAtDate }}</div>
          </div>
        </v-col>
        <v-col cols="8" class="d-flex flex-column justify-center">
          <template v-if="event.isSameDay">
            <div>{{ event.title }}</div>
            <div style="font-size: 14px">
              {{ event.eventStartAt }} - {{ event.eventEndAtTime }}
            </div>
          </template>
          <template v-else>
            <div>{{ event.title }}</div>
            <div style="font-size: 12px">
              {{ event.eventStartAt }} - {{ event.eventEndAt }}
            </div>
          </template>
        </v-col>
        <v-col
          v-if="event.available && !event.isPastEvent"
          cols="2"
          class="event__detail__card__to__detail text-center justify-center"
        >
          <div>
            <span>予約へ</span>
            <v-icon icon="mdi-chevron-right"></v-icon>
          </div>
        </v-col>
        <v-col
          v-else
          cols="2"
          class="event__detail__card__not_available text-center justify-center"
        >
          <div>
            <span>受付終了</span>
          </div>
        </v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup>
import { useLoadingStore } from "~/composables/states";

const nuxtApp = useNuxtApp();
const dayjs = useDayjs();
const currentDate = ref(dayjs());
const events = ref([]);
const selectedDateEventList = ref([]);
const displayCalendar = ref([]);

const props = defineProps({
  detailPath: {
    type: String,
    required: true,
  },
  targetVenueId: {
    type: String,
    required: false,
    default: null,
  },
});

onMounted(async () => {
  useLoadingStore().setBeginLoaging();
  await getAllEvents();
  getCalendar();
  useLoadingStore().setStopLoaging();
});
const displayMonth = computed(() => currentDate.value.format("YYYY年MM月"));
const currentMonth = computed(() => currentDate.value.format("YYYY-MM"));

const sortedEvents = computed(() => {
  return events.value.slice().sort((a, b) => {
    const startDate = dayjs(a.start).format("YYYY-MM-DD");
    const startDate2 = dayjs(b.start).format("YYYY-MM-DD");
    if (startDate < startDate2) return -1;
    if (startDate > startDate2) return 1;
    return 0;
  });
});

async function displayEventDetail(value) {
  try {
    useLoadingStore().setBeginLoaging();
    // value.dateを2桁に整形
    const formattedDay = value.date.toString().padStart(2, "0");

    // 日本時間の指定日 00:00:00 を生成 (例: "2025-07-15 00:00:00")
    const localStartOfDayString = `${value.month}-${formattedDay} 00:00:00`;

    // 日本時間としてパースし、その時刻をUTCに変換
    const startOfDayJST = nuxtApp
      .$dayjs(localStartOfDayString)
      .tz("Asia/Tokyo");
    const startOfDayUTC = startOfDayJST
      .utc()
      .format("YYYY-MM-DD HH:mm:ss.ssssss");

    // 日本時間の指定日の翌日 00:00:00 を生成し、UTCに変換
    const endOfDayJST = startOfDayJST.add(1, "day"); // 翌日 00:00:00
    const endOfDayUTC = endOfDayJST.utc().format("YYYY-MM-DD HH:mm:ss.ssssss");

    const result = await nuxtApp.$httpsCallable("getEventsOfTheDay", {
      nextDate: endOfDayUTC,
      date: startOfDayUTC,
    });
    // console.log("### L170", result);
    // console.log("### L170", props.targetVenueId);
    selectedDateEventList.value = result.data.res
      .filter(
        (v) =>
          v.publish === true &&
          v.delete_flag === false &&
          (!!props.targetVenueId
            ? v.venue_id === Number(props.targetVenueId)
            : true)
      )
      .map((v) => {
        return {
          title: v.venue_name,
          venueId: v.venue_id,
          eventId: v.id,
          eventStartAt: nuxtApp.$dayjs(v.start_date).format("MM/DD(dd)HH:mm"),
          eventStartAtDay: nuxtApp.$dayjs(v.start_date).format("DD"),
          eventStartAtDate: nuxtApp.$dayjs(v.start_date).format("dd"),
          eventEndAt: nuxtApp.$dayjs(v.end_date).format("MM/DD(dd)HH:mm"),
          eventEndAtDay: nuxtApp.$dayjs(v.end_date).format("DD"),
          eventEndAtDate: nuxtApp.$dayjs(v.end_date).format("dd"),
          eventEndAtTime: nuxtApp.$dayjs(v.end_date).format("HH:mm"),
          isSameDay:
            nuxtApp.$dayjs(v.start_date).format("YYYY-MM-DD") ===
            nuxtApp.$dayjs(v.end_date).format("YYYY-MM-DD"),
          available: v.participants_limit - v.reserve_count > 0,
          isPastEvent: nuxtApp
            .$dayjs(v.start_date)
            .startOf("day")
            .isBefore(nuxtApp.$dayjs().startOf("day")),
        };
      });
    nextTick(() => {
      var targetElement = document.getElementById("detail-container");
      var position = targetElement.getBoundingClientRect().top;
      window.scrollTo({
        top: position + 100,
        behavior: "smooth", // スムーズなアニメーション付きでスクロールします
      });
    });
  } catch (error) {
    console.error("Error calling Cloud Function:", error);
    window.alert(error.message || "イベントの取得に失敗しました");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

// supabaseから幸座情報を取得して指定の連想配列に整形する関数
async function getAllEvents() {
  try {
    // console.log("targetVenueId", props.targetVenueId);
    const payload = props.targetVenueId
      ? { targetVenueId: props.targetVenueId, isUserRequest: true }
      : { isUserRequest: true };
    const result = await nuxtApp.$httpsCallable("fetchAllEvents", payload);
    // console.log("### L215", result.data);

    result.data.res.forEach((event) => {
      events.value.push({
        id: event.id,
        name: event.venue_master.venue_name,
        start: event.start_date,
        end: event.end_date,
        color: "orange",
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
      // console.log("L289", dayEvents);
      weekRow.push({
        date: calendarDate.get("date"),
        month: calendarDate.format("YYYY-MM"),
        dayEvents,
      });
      calendarDate = calendarDate.add(1, "day");
    }
    calendars.push(weekRow);
  }
  //
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

function toReserve(event) {
  if (!event.available || event.isPastEvent) return;
  navigateTo({
    path: props.detailPath,
    query: {
      eventId: event.eventId,
    },
  });
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
  font-size: 10px;
  font-weight: bold;
  border: black solid 1px;
  border-radius: 5px;
  background-color: #1ac4de;
  height: 2rem;
  color: white;
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
</style>
