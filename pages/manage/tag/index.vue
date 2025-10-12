<template>
  <v-row class="justify-center mt-6">
    <v-col cols="12" md="7">
      <h2 class="mb-8">タグ管理</h2>
      <div class="d-flex justify-start mb-4">
        <v-btn
          color="#2F7FBE"
          class="primary-btn-common-font-style"
          @click="addTag()"
          >追加する
        </v-btn>
      </div>
      <v-list
        class="w-100"
        elevation="2"
        style="padding: 0"
        v-if="tagMasters.length > 0"
      >
        <div class="listRow headerRow">
          <div class="tagInfo">
            <span class="tagName">タグ名</span>
            <span class="tagVenue">紐付く会場</span>
          </div>
          <div class="tagAction"></div>
        </div>
        <v-divider />

        <template v-for="(tag, index) in tagMasters" :key="tag.id">
          <v-list-item class="listRow">
            <div class="tagInfo">
              <span class="tagName">{{ tag.name }}</span>
              <span class="tagVenue"
                >{{
                  tag.venue && tag.venue.trim() !== ""
                    ? tag.venue
                    : "会場未登録"
                }}
                <v-icon
                  icon="mdi-pencil-outline"
                  color="green"
                  size="18"
                  class="ml-2 cursor-pointer"
                  @click="editTag(tag)"
                />
              </span>
            </div>
            <template v-slot:append>
              <v-btn
                color="error"
                class="primary-btn-common-font-style"
                @click="deleteTag(tag)"
                >削除</v-btn
              >
            </template>
          </v-list-item>
          <v-divider />
        </template>
      </v-list>
      <p v-else class="text-center text-grey-darken-1 mt-4">
        タグを追加してください
      </p>
    </v-col>
  </v-row>

  <v-dialog v-model="saveTagDialog" max-width="400" persistent>
    <v-card>
      <v-card-item>
        <v-card-title>
          {{ isEditMode ? "タグの編集" : "タグの追加" }}
        </v-card-title>
        <v-row class="mt-4 align-center">
          <v-col cols="3" class="text-right pr-5">
            <span style="color: red">必須</span>
          </v-col>
          <v-col cols="8">
            <v-text-field
              v-model="inputTag"
              label="タグ名を入力"
              clearable
              @input="clearError"
            />
          </v-col>
        </v-row>
        <p v-if="errorMessage" style="color: red">{{ errorMessage }}</p>
        <v-row>
          <v-col cols="3" />
          <v-col cols="8">
            <v-select
              v-model="selectedVenueIds"
              class="mt-4"
              label="会場を選択"
              :items="venues"
              item-title="venue_name"
              item-value="id"
              variant="outlined"
              multiple
              chips
            />
          </v-col>
        </v-row>
      </v-card-item>

      <v-card-actions class="px-4 pb-4 pt-2 justify-center">
        <v-row dense no-gutters class="w-100" style="max-width: 300px">
          <v-col cols="6" class="pr-2">
            <v-btn block class="cancelBtn" @click="resetDialog">
              キャンセル
            </v-btn>
          </v-col>
          <v-col cols="6" class="pl-2">
            <v-btn
              block
              class="submitBtn"
              :disabled="isTagEmpty"
              @click="registerTag()"
            >
              {{ isEditMode ? "更新" : "登録" }}
            </v-btn>
          </v-col>
        </v-row>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="deleteTagDialog" max-width="400" persistent>
    <v-card>
      <v-card-item>
        <v-card-title>タグの削除</v-card-title>
        <v-card-text class="pa-4">
          以下のタグを削除します。よろしいですか？
          <strong class="d-block mt-4">{{ selectedTag?.name }}</strong>
        </v-card-text>
      </v-card-item>
      <v-card-actions class="px-4 pb-4 pt-2 justify-center">
        <v-row dense no-gutters class="w-100" style="max-width: 300px">
          <v-col cols="6" class="pr-2">
            <v-btn block class="cancelBtn" @click="deleteTagDialog = false">
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
const saveTagDialog = ref(false);
const inputTag = ref("");
const errorMessage = ref("");
const selectedTag = ref("");
const deleteTagDialog = ref(false);
const tagMasters = ref([]);
const venues = ref([]);
const selectedVenueIds = ref([]);
const isEditMode = ref(false);
const editingTagId = ref(null);
const infoStore = useInfoStore();

// 初期処理
onMounted(() => {
  useLoadingStore().setBeginLoaging();
  fetchVenues();
  fetchTagMaster();
  useLoadingStore().setStopLoaging();
});

// 算出プロパティ
const isLoading = computed(() => {
  return loadingState.value.isLoading;
});

const isTagEmpty = computed(() => {
  return !inputTag.value?.trim?.(); // null/undefined対策
});

// タグ追加ボタン
function addTag() {
  resetDialog();
  saveTagDialog.value = true;
}

function resetDialog() {
  errorMessage.value = "";
  inputTag.value = "";
  selectedVenueIds.value = [];
  isEditMode.value = false;
  saveTagDialog.value = false;
}

// タグ追加確定ボタン
function registerTag() {
  if (isTagEmpty.value) {
    errorMessage.value = "タグ名を入力してください";
    return;
  }

  const normalizedInput = inputTag.value.trim().toLowerCase();
  // 重複チェック（自分自身を除く）
  const isDuplicate = tagMasters.value.some((tag) => {
    return (
      tag.name.toLowerCase() === normalizedInput &&
      (!isEditMode.value || tag.id !== editingTagId.value)
    );
  });
  if (isDuplicate) {
    errorMessage.value = "このタグはすでに存在します";
    return;
  }
  errorMessage.value = "";

  if (isEditMode.value) {
    // 編集モード：更新処理
    updateTag(editingTagId.value, inputTag.value, selectedVenueIds.value);
  } else {
    // 追加モード：新規作成
    insertTag(inputTag.value, selectedVenueIds.value);
  }
  resetForm();
}

// 入力変更時にエラーメッセージをクリア
function clearError() {
  errorMessage.value = "";
}

//編集ボタン
function editTag(tag) {
  errorMessage.value = "";
  isEditMode.value = true;
  editingTagId.value = tag.id;
  inputTag.value = tag.name;
  selectedVenueIds.value = tag.venues.map((v) => v.id);
  saveTagDialog.value = true;
}

function resetForm() {
  errorMessage.value = "";
  isEditMode.value = false;
  editingTagId.value = null;
  inputTag.value = "";
  selectedVenueIds.value = [];
  saveTagDialog.value = false;
}

// 削除ボタン
function deleteTag(tag) {
  selectedTag.value = tag;
  deleteTagDialog.value = true;
}

// 削除確定ボタン
function confirmDelete() {
  rejectTag(selectedTag.value.id);
  deleteTagDialog.value = false;
  selectedTag.value = "";
}

//タグ一覧を取得
async function fetchTagMaster() {
  try {
    useLoadingStore().setBeginLoaging();
    const result = await nuxtApp.$httpsCallable("getTagVenue", {});
    tagMasters.value = result.data.res.map((tag) => ({
      id: tag.id,
      name: tag.tag_name,
      venue: tag.tag_venue_linkage
        .map((link) => link.venue_master?.venue_name)
        .filter(Boolean)
        .join(", "),
      venues: tag.tag_venue_linkage.map((link) => ({
        id: link.venue_id,
        name: link.venue_master?.venue_name,
      })),
    }));
  } catch (error) {
    console.error("fetchTagMaster:", error);
    window.alert("タグ一覧の取得に失敗しました。リロードしてください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

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

//タグの追加
async function insertTag(name, venueIds) {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("createTag", { name, venueIds });
    fetchTagMaster();
    infoStore.setInfoMessage("タグを登録しました");
  } catch (error) {
    window.alert("タグの追加に失敗しました。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

async function updateTag(id, name, venueIds) {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("updateTag", {
      id,
      name,
      venueIds,
    });
    infoStore.setInfoMessage("タグ設定を変更しました");
    fetchTagMaster();
  } catch (error) {
    window.alert("タグの編集に失敗しました。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

// タグを削除
async function rejectTag(id) {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("removeTag", { id });
    infoStore.setInfoMessage("タグを削除しました");
    fetchTagMaster();
  } catch (error) {
    console.error("removeTag:", error);
    window.alert("タグの削除に失敗しました。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}
</script>

<style>
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

.tagInfo {
  display: flex;
  gap: 32px;
  align-items: center;
  flex: 1;
}

.tagName {
  flex: 0 0 150px;
}

.tagVenue {
  flex: 1;
  min-width: 150px;
}

.tagAction {
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
