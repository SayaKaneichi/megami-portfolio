<template>
  <v-row class="justify-center mt-6">
    <v-col cols="12" md="7">
      <h2 class="mb-8">会場管理</h2>
      <div class="d-flex justify-start mb-4">
        <v-btn
          color="#2F7FBE"
          class="primary-btn-common-font-style"
          @click="addVenue()"
          >追加する
        </v-btn>
      </div>
      <v-list
        class="w-100"
        elevation="2"
        style="padding: 0"
        v-if="venues.length > 0"
      >
        <div class="listRow headerRow">
          <div class="venueInfo">
            <span class="venueName">会場名</span>
            <span class="venueAddress">住所</span>
          </div>
          <div class="action"></div>
        </div>
        <v-divider />

        <template v-for="(venue) in venues" :key="venue.id">
          <v-list-item class="listRow">
            <div class="venueInfo">
              <span class="venueName">{{ venue.name }}</span>
              <span class="venueAddress">{{venue.address}}</span>
            </div>
            <template v-slot:append>
              <v-icon
                icon="mdi-pencil-outline"
                color="green"
                size="25"
                class="mr-4 cursor-pointer"
                @click="editVenue(venue)"
              />
              <v-btn
                color="error"
                class="primary-btn-common-font-style"
                @click="deleteVenue(venue)"
                >削除</v-btn
              >
            </template>
          </v-list-item>
          <v-divider />
        </template>
      </v-list>
      <p v-else class="text-center text-grey-darken-1 mt-4">
        会場を追加してください
      </p>
    </v-col>
  </v-row>

  <v-dialog v-model="venueDialog" max-width="400" persistent>
    <v-card>
      <v-card-item>
        <v-card-title>
          {{ isEditMode ? "会場の編集" : "会場の追加" }}
        </v-card-title>
        <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
        <v-row class="mt-4 justify-center ">
          <v-col cols="8">
            <v-text-field
              v-model="inputVenue"
              label="会場名を入力"
              clearable
              @input="clearError"
            />
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="inputAddress"
              label="住所を入力"
              clearable
              @input="clearError"
            />
          </v-col>
        </v-row>
      </v-card-item>

      <v-card-actions class="px-4 pb-4 pt-2 justify-center">
        <v-row dense no-gutters class="w-100" style="max-width: 300px">
          <v-col cols="6" class="pr-2">
            <v-btn block class="cancelBtn" @click="resetForm">
              キャンセル
            </v-btn>
          </v-col>
          <v-col cols="6" class="pl-2">
            <v-btn
              block
              class="submitBtn"
              :disabled="isRequiredField"
              @click="registerVenue()"
            >
              {{ isEditMode ? "保存" : "登録" }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteVenueDialog" max-width="400" persistent>
    <v-card>
      <v-card-item>
        <v-card-title>会場の削除</v-card-title>
        <v-card-text class="pa-4">
          以下の会場を削除します。よろしいですか？
          <strong class="d-block mt-4">{{ selectedVenue.name }}</strong>
        </v-card-text>
      </v-card-item>
      <v-card-actions class="px-4 pb-4 pt-2 justify-center">
        <v-row dense no-gutters class="w-100" style="max-width: 300px">
          <v-col cols="6" class="pr-2">
            <v-btn block class="cancelBtn" @click="deleteVenueDialog = false">
              キャンセル
            </v-btn>
          </v-col>
          <v-col cols="6" class="pl-2">
            <v-btn block class="submitBtn" @click="confirmDelete()">
              削除
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
</template>

<script setup>
import { useLoadingStore } from "~/composables/states";
import { useInfoStore } from "~/composables/info";
import InfoDialog from "~/components/infoDialog.vue";
const { state: loadingState } = useLoadingStore();

const nuxtApp = useNuxtApp();
const venueDialog = ref(false);
const inputVenue = ref("");
const inputAddress = ref("");
const errorMessage = ref("");
const selectedVenue = ref("");
const deleteVenueDialog = ref(false);
const venues = ref([]);
const isEditMode = ref(false);
const editingVenueId = ref(null);
const infoStore = useInfoStore();

// 初期処理
onMounted(() => {
  useLoadingStore().setBeginLoaging();
  fetchVenues();
  useLoadingStore().setStopLoaging();
});

// 算出プロパティ
const isLoading = computed(() => {
  return loadingState.value.isLoading;
});

const isRequiredField = computed(() => {
  return !inputAddress.value?.trim?.() || !inputVenue.value?.trim?.(); // null/undefined対策
});

// 会場追加ボタン
function addVenue() {
  resetForm();
  venueDialog.value = true;
}

function resetForm() {
  errorMessage.value = "";
  isEditMode.value = false;
  editingVenueId.value = null;
  inputVenue.value = "";
  inputAddress.value = "";
  venueDialog.value = false;
}

// 会場追加確定ボタン
function registerVenue() {
  if (isRequiredField.value) {
    errorMessage.value = "会場名と住所を入力してください";
    return;
  }
  const normalizedInput = inputVenue.value.trim().toLowerCase();
  // 重複チェック（自分自身を除く）
  const isDuplicate = venues.value.some((venue) => {
    return (
      venue.name.toLowerCase() === normalizedInput &&
      (!isEditMode.value || venue.id !== editingVenueId.value)
    );
  });
  if (isDuplicate) {
    errorMessage.value = "この会場はすでに存在します";
    return;
  }
  errorMessage.value = "";

  if (isEditMode.value) {
    // 編集モード：更新処理
    updateVenue(editingVenueId.value, inputVenue.value, inputAddress.value);
  } else {
    // 追加モード：新規作成
    insertVenue(inputVenue.value, inputAddress.value);
  }
  resetForm();
}

// 入力変更時にエラーメッセージをクリア
function clearError() {
  errorMessage.value = "";
}

//編集ボタン
function editVenue(venue) {
  errorMessage.value = "";
  isEditMode.value = true;
  editingVenueId.value = venue.id;
  inputVenue.value = venue.name;
  inputAddress.value = venue.address;
  venueDialog.value = true;
}

// 削除ボタン
function deleteVenue(venue) {
  selectedVenue.value = venue;
  deleteVenueDialog.value = true;
}

// 削除確定ボタン
function confirmDelete() {
  rejectVenue(selectedVenue.value.id);
  deleteVenueDialog.value = false;
  selectedVenue.value = "";
}

//会場一覧の取得
async function fetchVenues() {
  try {
    const result = await nuxtApp.$httpsCallable("fetchVenues", {});
    // venues.value = result.data?.res || [];
    venues.value = result.data.res.map((venue) => ({
      id: venue.id,
      name: venue.venue_name,
      address: venue.venue_address
    }));
  } catch (error) {
    console.error("fetchVenues failed:", error);
    venues.value = [];
  }
}

//会場の追加
async function insertVenue(name, address) {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("createVenue", { 
      venue_name: name, 
      venue_address: address 
    });
    fetchVenues();
    infoStore.setInfoMessage("会場を登録しました");
  } catch (error) {
    window.alert("会場の追加に失敗しました。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

//会場の編集
async function updateVenue(id, name, address) {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("updateVenue", {
      id,
      venue_name: name,
      venue_address: address,
    });
    infoStore.setInfoMessage("会場設定を変更しました");
    fetchVenues();
  } catch (error) {
    window.alert("会場の編集に失敗しました。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

// 会場を削除
async function rejectVenue(id) {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("removeVenue", { id });
    infoStore.setInfoMessage("会場を削除しました");
    fetchVenues();
  } catch (error) {
    console.error("removeVenue:", error);
    window.alert("会場の削除に失敗しました。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}
</script>

<style scoped lang="scss">
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

.venueInfo {
  display: flex;
  gap: 32px;
  align-items: center;
  flex: 1;
}

.venueName {
  flex: 0 0 150px;
}

.venueAddress {
  flex: 1;
  min-width: 150px;
}

.action {
  min-width: 80px;
  display: flex;
  justify-content: flex-end;
}

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
