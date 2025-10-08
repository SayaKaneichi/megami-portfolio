<template>
  <v-row class="justify-center mt-6">
    <v-col cols="12" md="7">
      <h2 class="mb-8">友だちリスト</h2>
      <v-list
        class="w-100"
        elevation="2"
        style="padding: 0"
        v-if="members.length > 0"
      >
        <div class="listRow headerRow">
          <div class="iconCol"></div>
          <div class="nameCol">LINE登録者名</div>
          <div class="tagCol">タグ名</div>
          <div class="countCol">参加回数（予定含む）</div>
        </div>
        <v-divider />

        <template v-for="(member, index) in members" :key="member.id">
          <div class="listRow">
            <div class="iconCol">
              <img :src="member.image" alt="LINEアイコン" class="memberIcon" />
            </div>
            <div class="nameCol">
              {{ member.name }}
            </div>
            <div class="tagCol">
              {{
                member.tag && member.tag.trim() !== ""
                  ? member.tag
                  : "タグ未登録"
              }}
              <v-icon
                icon="mdi-pencil-outline"
                color="green"
                size="18"
                class="ml-2 cursor-pointer"
                @click="editTag(member)"
              />
            </div>
            <div class="countCol">{{ member.count }}回</div>
          </div>
          <v-divider />
        </template>
      </v-list>
      <p v-else class="text-center text-grey-darken-1 mt-4">
        登録者がいません。
      </p>
    </v-col>
  </v-row>

  <v-dialog v-model="editTagDialog" max-width="400" persistent>
    <v-card>
      <v-card-item>
        <v-card-title> タグ付 </v-card-title>
        <v-row>
          <v-col>
            <v-select
              v-model="selectedTagIds"
              class="mt-8"
              label="タグを選択"
              :items="tags"
              item-title="tag_name"
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
            <v-btn block class="submitBtn" @click="updateMemberTag()">
              登録する
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
const editTagDialog = ref(false);
const members = ref([]);
const selectedTagIds = ref([]);
const isEditMode = ref(false);
const tags = ref([]);
const selectedMemberId = ref("");
const infoStore = useInfoStore();

// 初期処理
onMounted(() => {
  useLoadingStore().setBeginLoaging();
  fetchTags();
  fetchMember();
  useLoadingStore().setStopLoaging();
});

// 算出プロパティ
const isLoading = computed(() => {
  return loadingState.value.isLoading;
});

//タグリンク編集
async function updateMemberTag() {
  try {
    useLoadingStore().setBeginLoaging();
    await nuxtApp.$httpsCallable("updateMemberTag", {
      memberId: selectedMemberId.value,
      tagIds: selectedTagIds.value,
    });

    infoStore.setInfoMessage("タグ設定を変更しました");
    fetchMember();
    editTagDialog.value = false;
  } catch (error) {
    console.error("updateMemberTag failed:", error);
    window.alert("タグの編集ができませんでした。もう一度お試しください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

//編集ボタン
function editTag(member) {
  selectedMemberId.value = member.user_id;
  selectedTagIds.value = member.tags.map((t) => t.id);
  editTagDialog.value = true;
}

//友達一覧を取得
async function fetchMember() {
  try {
    useLoadingStore().setBeginLoaging();
    const result = await nuxtApp.$httpsCallable("getMember", {});
    members.value = result.data.res.map((member) => ({
      user_id: member.user_id,
      name: member.display_name,
      image: member.picture_url,
      tag: member.tag_member_linkage
        .map((link) => link.tag_master?.tag_name)
        .filter(Boolean)
        .join(", "),
      tags: member.tag_member_linkage.map((link) => ({
        id: link.tag_master.id,
        name: link.tag_master?.tag_name,
      })),
      count: member.reservation_count || 0,
    }));
  } catch (error) {
    console.error("fetchMember:", error);
    window.alert("友だち一覧の取得に失敗しました。リロードしてください。");
  } finally {
    useLoadingStore().setStopLoaging();
  }
}

//タグ一覧の取得
async function fetchTags() {
  const result = await nuxtApp.$httpsCallable("getTagVenue", {});
  tags.value = result.data?.res;
}

function resetDialog() {
  selectedTagIds.value = [];
  isEditMode.value = false;
  editTagDialog.value = false;
}
</script>

<style>
.listRow {
  display: flex;
  align-items: center;
  padding: 16px;
  gap: 16px;
}

.headerRow {
  font-weight: bold;
  background-color: #12c646;
  color: white;
}

.iconCol {
  width: 40px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.nameCol {
  flex: 2;
  min-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tagCol {
  flex: 3;
  min-width: 150px;
  overflow-wrap: break-word;
  display: flex;
  align-items: center;
}

.countCol {
  flex: 1;
  min-width: 90px;
  overflow-wrap: break-word;
  display: flex;
  align-items: center;
  text-align: left;
}

.memberIcon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
