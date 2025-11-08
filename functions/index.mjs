import "dotenv/config";
import { onCall, onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as functions from "firebase-functions"; 

// ESモジュール対応のインポート
import { createClient } from "@supabase/supabase-js";
// import * as logger from "firebase-functions/logger";
import dayjs from "dayjs";
import "dayjs/locale/ja.js"; // 日本語ロケール
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import { NOTIFICATION_TYPES } from "./utils/shared/notificationTypes.js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ja"); // 曜日を日本語で表示する


export const fetchAllEvents = onCall(async (request) => {
  try {
    const val = request.data; // ← パラメータはここから取る
    // const context = request;   // 認証情報などはここに入ってる

    let query = supabaseAdmin
      .from("event_manage")
      .select("*,venue_master(id,venue_name)");

    if (val.targetVenueId) {
      query = query.eq("venue_id", val.targetVenueId);
    }

    if (val.isUserRequest) {
      query = query.eq("delete_flag", false).eq("publish", true);
    }

    const { data: res, error: fetchAllEventError } = await query;
    // console.log("#####", res);

    if (fetchAllEventError) {
      console.log(fetchAllEventError);
      throw new Error("イベントの取得に失敗しました。リロードしてください。");
    }

    return {
      message: "successfully",
      res: res,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const getEventsOfTheDay = onCall(async (request) => {
  try {
    const val = request.data; // ← パラメータはここから取る
    // const context = request;   // 認証情報などはここに入ってる
    // console.log("#####", val);
    const { data: event, error: eventErr } = await supabaseAdmin.rpc(
      "get_events_of_the_day",
      {
        p_next_date: val.nextDate,
        p_today: val.date,
      }
    );
    if (eventErr) {
      console.log(eventErr);
      throw new Error(
        "イベント詳細の取得に失敗しました。リロードしてください。"
      );
    }

    return {
      message: "successfully",
      res: event,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const getEventDetail = onCall(async (request) => {
  try {
    const val = request.data; // ← パラメータはここから取る
    // const context = request;   // 認証情報などはここに入ってる
    // console.log("#####", val);
    const { data: eventDetail, error: eventDetailErr } = await supabaseAdmin
      .from("event_manage")
      .select("*,venue_master(id,venue_name)")
      .eq("id", val.targetEventId);

    if (eventDetailErr || eventDetail.length !== 1) {
      console.log(eventDetailErr);
      throw new Error(
        "イベント詳細が取得できませんでした。カレンダーから選択し直してください。"
      );
    }

    const { data, count, error } = await supabaseAdmin
      .from("reserve_manage")
      .select("guest_id", { count: "exact" })
      .eq("event_id", val.targetEventId)
      .eq("cancel_flag", false);

    if (error) {
      console.log(eventDetailErr);
      throw new Error(
        "イベント情報の取得に失敗しました。カレンダーから選択し直してください。"
      );
    }

    return {
      message: "successfully",
      res: eventDetail[0],
      reserve: data,
      count: count,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const fetchReserveHistory = onCall(async (request) => {
  try {
    const val = request.data; // ← パラメータはここから取る
    // const context = request;   // 認証情報などはここに入ってる
    // console.log("#####", val);
    const { data: reserveHistory, error: reserveHistoryErr } =
      await supabaseAdmin
        .from("reserve_manage")
        .select("*,event_manage(*,venue_master(id,venue_name))")
        .eq("guest_id", val.userId)
        .order("created_at", { ascending: false });

    if (reserveHistoryErr) {
      console.log(reserveHistoryErr);
      throw new Error("予約履歴の取得に失敗しました。再度開き直してください。");
    }

    return {
      message: "successfully",
      res: reserveHistory
        .sort((a, b) => {
          const dateA = new Date(a.event_manage.start_date);
          const dateB = new Date(b.event_manage.start_date);
          return dateB - dateA; // 降順（新しい順）
        })
        .map((v) => {
          return {
            reserveId: v.id,
            eventId: v.event_id,
            note: v.note,
            registrationFee: v.event_manage.registration_fee,
            eventStartDate: v.event_manage.start_date,
            eventEndDate: v.event_manage.end_date,
            venueName: v.event_manage.venue_master.venue_name,
            cancelFlag: v.cancel_flag,
          };
        }),
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const toReserve = onCall(async (request) => {
  try {
    const val = request.data; 
    const { data: reserve, error: reserveErr } = await supabaseAdmin
      .from("reserve_manage")
      .insert({
        ...val,
      })
      .select("id")
      .single();

    if (reserveErr) {
      console.log(reserveErr);
      throw new Error(
        "予約に失敗しました。予約フォームを閉じ、右上の3本線のメニューからブロック→ブロック解除の手順を踏んでから、再度試してください。"
      );
    }

    return {
      message: "successfully",
      res: reserve,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const toCancel = onCall(async (request) => {
  try {
    const val = request.data; // ← パラメータはここから取る
    // const context = request;   // 認証情報などはここに入ってる
    // console.log("#####", val);
    let query = supabaseAdmin
      .from("reserve_manage")
      .update({ cancel_flag: true })
      .eq("guest_id", val.userId);

    if (val.targetEventId) {
      query = query.eq("event_id", val.targetEventId);
    }

    if (val.reserveId) {
      query = query.eq("id", val.reserveId);
    }

    const { error: cancelErr } = await query;

    if (cancelErr) {
      console.log(cancelErr);
      throw new Error("キャンセルに失敗しました。再度試してください。");
    }

    return {
      message: "successfully",
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const fetchVenues = onCall(async (_request) => {
  try {
    const { data: res, error: VenueError } = await supabaseAdmin
      .from("venue_master")
      .select("*");

    if (VenueError) {
      console.log(VenueError);
      throw new Error("会場の取得に失敗しました。。リロードしてください。");
    }

    return {
      message: "successfully",
      res: res,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//タグ追加と会場をリンク
export const createTag = onCall(async (request) => {
  try {
    const { name, venueIds } = request.data;

    // タグを tag_master に追加
    const { data: res, error: tagError } = await supabaseAdmin
      .from("tag_master")
      .insert({ tag_name: name })
      .select();

    if (tagError || !res || res.length === 0) {
      console.log(tagError);
      throw new Error(
        "タグの追加に失敗しました。リロードして再度試してください。"
      );
    }

    const tagId = res[0].id;

    // venueIds（配列）を使ってリンクデータを生成
    const linkData = venueIds.map((venueId) => ({
      tag_id: tagId,
      venue_id: venueId,
    }));

    const { error: linkError } = await supabaseAdmin
      .from("tag_venue_linkage")
      .insert(linkData); // ← 複数挿入

    if (linkError) {
      console.log(linkError);
      throw new Error(
        "リンク情報の登録に失敗しました。リロードして再度試してください。"
      );
    }
    return {
      message: "successfully",
      res,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//タグ一覧表示
export const getTagVenue = onCall(async (_request) => {
  try {
    const { data: res, error: getTagError } = await supabaseAdmin.from(
      "tag_master"
    ).select(`
      id,
      tag_name,
      tag_venue_linkage (
        venue_id,
        venue_master:venue_id (
          venue_name
        )
      )
    `);

    if (getTagError) {
      console.log(getTagError);
      throw new Error("タグ情報の取得に失敗しました。リロードしてください。");
    }
    return {
      message: "successfully",
      res,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//タグマスタとタグ会場リンクを削除
export const removeTag = onCall(async (request) => {
  const tagId = request.data.id;
  try {
    //中間テーブルから削除
    const { error: linkageError } = await supabaseAdmin
      .from("tag_venue_linkage")
      .delete()
      .eq("tag_id", tagId);

    if (linkageError) {
      console.error(linkageError);
      throw new Error(
        "タグと会場紐付けの削除に失敗しました。リロードして再度試してください。"
      );
    }

    //タグマスターから削除
    const { error: tagError } = await supabaseAdmin
      .from("tag_master")
      .delete()
      .eq("id", tagId);

    if (tagError) {
      console.error(tagError);
      throw new Error(
        "タグの削除に失敗しました。リロードして再度試してください。"
      );
    }
    return {
      message: "successfully",
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//タグと会場の編集
export const updateTag = onCall(async (request) => {
  try {
    const { id, name } = request.data;
    const rawVenueIds = request.data.venueIds ?? [];

    const { error: tagError } = await supabaseAdmin
      .from("tag_master")
      .update({ tag_name: name })
      .eq("id", id);

    if (tagError) {
      throw new Error(
        "タグの変更に失敗しました。。リロードして再度試してください。"
      );
    }

    // 既存のリンクを削除
    const tagId = id;
    const { error: deleteError } = await supabaseAdmin
      .from("tag_venue_linkage")
      .delete()
      .eq("tag_id", tagId);

    if (deleteError) {
      console.log(deleteError);
      throw new Error(
        "変更前のタグと会場紐付け削除に失敗しました。リロードして再度試してください。"
      );
    }

    // venueIds のフィルタリング
    const filteredVenueIds = rawVenueIds.filter((id) => id != null);

    const linkData = filteredVenueIds.map((venueId) => ({
      tag_id: tagId,
      venue_id: venueId,
    }));

    const { error: linkError } = await supabaseAdmin
      .from("tag_venue_linkage")
      .insert(linkData);

    if (linkError) {
      console.log(linkError);
      throw new Error(
        "リンク情報の登録に失敗しました。リロードして再度試してください。"
      );
    }

    return {
      message: "successfully",
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//メンバー一覧表示
export const getMember = onCall(async (_request) => {
  try {
    const { data: res, error: getMemberError } = await supabaseAdmin
      .from("member")
      .select(
        `
      user_id,
      display_name,
      picture_url,
      tag_member_linkage (
        tag_master (
          id,
          tag_name
        )
      )
    `
      )
      .order("display_name", { ascending: true });

    if (getMemberError) {
      console.log(getMemberError);
      throw new Error("タグ情報の取得に失敗しました。リロードしてください。");
    }

    const { data: reservations, error: countError } = await supabaseAdmin
      .from("reserve_manage")
      .select("guest_id")
      .eq("cancel_flag", false);

    if (countError) {
      console.error(countError);
      throw new Error("参加回数の取得に失敗しました。リロードしてください。");
    }

    // 件数をマップ形式に変換
    const countsMap = {};
    reservations.forEach((r) => {
      countsMap[r.guest_id] = (countsMap[r.guest_id] || 0) + 1;
    });

    // イベントデータに予約人数を追加
    const response = res.map((member) => ({
      ...member,
      reservation_count: countsMap[member.user_id] || 0,
    }));

    return {
      message: "successfully",
      res: response,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//メンバーとタグをリンクして登録
export const tagMemberLinkage = onCall(async (request) => {
  try {
    const { memberId, tagIds } = request.data;

    if (!memberId || !Array.isArray(tagIds) || tagIds.length === 0) {
      throw new functions.https.HttpsError(
        "友だちリストのタグ情報登録に失敗しました。リロードして再度試してください。"
      );
    }

    const linkData = tagIds.map((tagId) => ({
      tag_master: tagId,
      member_id: String(memberId),
    }));

    const { error: linkError } = await supabaseAdmin
      .from("tag_member_linkage")
      .insert(linkData);

    if (linkError) {
      console.error(linkError);
      throw new Error(
        "メンバーとタグの紐づけに失敗しました。リロードして再度試してください。"
      );
    }

    return {
      message: "successfully",
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const updateMemberTag = onCall(async (request) => {
  try {
    const { memberId, tagIds } = request.data;

    if (!memberId || !Array.isArray(tagIds)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "memberId または tagIds が無効です"
      );
    }

    // 1. 古いリンクを削除
    const { error: deleteError } = await supabaseAdmin
      .from("tag_member_linkage")
      .delete()
      .eq("member_id", memberId);

    if (deleteError) {
      console.error(deleteError);
      throw new Error(
        "既存のタグリンク削除に失敗しました。リロードして再度試してください"
      );
    }

    // 2. 新しいリンクを挿入（空配列はスキップ）
    if (tagIds.length > 0) {
      const linkData = tagIds.map((tagId) => ({
        member_id: memberId,
        tag_master: tagId,
      }));

      const { error: insertError } = await supabaseAdmin
        .from("tag_member_linkage")
        .insert(linkData);

      if (insertError) {
        console.error(insertError);
        throw new Error("新しいタグリンクの挿入に失敗しました。");
      }
    }

    return { message: "タグの更新に成功しました" };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const fetchNotifications = onCall(async (_request) => {
  try {
    const { data: res, error: NotificationError } = await supabaseAdmin
      .from("notification_setting")
      .select("*");

    if (NotificationError) {
      console.log(NotificationError);
      throw new Error("会場の取得に失敗しました。リロードしてください。");
    }

    return {
      message: "successfully",
      res: res,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

// JST 20:00 に実行される処理
// export const scheduledNotification = onSchedule(
//   { schedule: "0 11 * * *", region: "us-central1" },
//   async (event) => {
// // JST 8:00〜20:00 に毎時発火
export const scheduledNotification = onSchedule(
  {
    schedule: "0 8-20/1 * * *", // JSTで8時〜20時を1時間おきに
    timeZone: "Asia/Tokyo", // JST基準で動かす
    region: "us-central1",
  },
  async (_event) => {
    try {
      // JST（日本時間）で昨日の0:00と23:59を作成し、UTCに変換
      const now = new Date();
      const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      // 現在のJST時刻を HH:mm:ss 形式に整形
      const pad = (n) => n.toString().padStart(2, "0");
      // ±5分の範囲を計算
      const fiveMinutesBefore = new Date(jst.getTime() - 5 * 60 * 1000);
      const fiveMinutesAfter = new Date(jst.getTime() + 5 * 60 * 1000);
      const rangeStart = `${pad(fiveMinutesBefore.getHours())}:${pad(fiveMinutesBefore.getMinutes())}:00`;
      const rangeEnd = `${pad(fiveMinutesAfter.getHours())}:${pad(fiveMinutesAfter.getMinutes())}:59`;

      // 該当時間の通知を取得
      const { data, error } = await supabaseAdmin
        .from("notification_setting")
        .select("notification_type,venue_notification_linkage(venue_id)")
        .gte("notification_time", rangeStart)
        .lte("notification_time", rangeEnd)
        .eq("enabled", true);

      if (error) {
        console.log(error);
        throw new Error(
          "scheduledNotification: 該当時間の通知取得処理でエラー"
        );
      }
      // 当該時間の通知がなければ処理終了
      if (data.length === 0) return;

      // あった場合、分岐処理
      for (const type of data) {
        // console.log("### type", type);
        switch (type.notification_type) {
          case NOTIFICATION_TYPES.EVENT_REMINDER:
            await sendRemind();
            break;
          case NOTIFICATION_TYPES.VACANCY_REMINDER:
            await sendVacancyRemind(type.venue_notification_linkage);
            break;
          default:
            console.log("Unhandled type:", type.key);
        }
      }
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      throw new functions.https.HttpsError(
        "internal",
        error.message || "予期しないエラーが発生しました"
      );
    }
  }
);

//イベント一覧取得
export const fetchEvents = onCall(async (request) => {
  try {
    const { year, month, venue } = request.data;
    let query = supabaseAdmin.from("event_manage").select(`
        id,
        start_date,
        registration_fee,
        delete_flag,
        venue_master (
          venue_name
        )
      `);

    if (!!year && !!month) {
      // ゼロ埋め（2桁）
      const paddedMonth = month.padStart(2, "0");

      // JSTの開始日時
      const startJST = dayjs.tz(
        `${year}-${paddedMonth}-01T00:00:00`,
        "Asia/Tokyo"
      );
      // JSTの翌月1日（＝終了範囲）
      const endJST = startJST.add(1, "month");

      // Supabaseに渡すのは UTC（ISO文字列）
      const startUTC = startJST.toISOString();
      const endUTC = endJST.toISOString();
      query = query.gte("start_date", startUTC).lt("start_date", endUTC);
    } else if (!!year && !month) {
      // JSTで年初と年末を定義
      const startJST = dayjs.tz(`${year}-01-01T00:00:00`, "Asia/Tokyo");
      const endJST = startJST.add(1, "year");

      // UTCでSupabaseに渡す
      const startUTC = startJST.toISOString();
      const endUTC = endJST.toISOString();
      query = query.gte("start_date", startUTC).lt("start_date", endUTC);
    }

    if (!!venue) {
      query = query.eq("venue_id", venue);
    }

    const { data: events, error: eventsError } =
      await query.order("start_date");

    if (eventsError) {
      console.error(eventsError);
      throw new Error("イベントの取得に失敗しました。リロードしてください。");
    }

    const { data: reservations, error: countError } = await supabaseAdmin
      .from("reserve_manage")
      .select("event_id")
      .eq("cancel_flag", false);
    if (countError) {
      console.error(countError);
      throw new Error("予約数の取得に失敗しました。リロードしてください。");
    }

    // 件数をマップ形式に変換
    const countsMap = {};
    reservations.forEach((r) => {
      countsMap[r.event_id] = (countsMap[r.event_id] || 0) + 1;
    });

    // イベントデータに予約人数を追加
    const enrichedEvents = events.map((event) => ({
      ...event,
      reservation_count: countsMap[event.id] || 0,
    }));

    return {
      message: "successfully",
      res: enrichedEvents,
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//イベント追加と会場をリンク
export const createEvent = onCall(async (request) => {
  try {
    const {
      venue_id,
      start_date,
      end_date,
      participants_limit,
      registration_fee,
      publish,
    } = request.data;

    const { error: insertError } = await supabaseAdmin
      .from("event_manage")
      .insert([
        {
          venue_id,
          start_date,
          end_date,
          participants_limit,
          registration_fee,
          publish,
          delete_flag: false, // 初期は false 固定
        },
      ]);

    if (insertError) {
      console.error(insertError);
      throw new Error(
        "イベント登録に失敗しました。。リロードして再度試してください。"
      );
    }

    return { message: "successfully" };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

export const createVenue = onCall(async (request) => {
  try {
    const { venue_name, venue_address } = request.data;

    const { data, error } = await supabaseAdmin
      .from("venue_master")
      .insert([{ venue_name, venue_address }])
      .select();

    if (error || !data || data.length === 0) {
      console.error(error);
      throw new Error(
        "会場登録に失敗しました。リロードして再度試してください。"
      );
    }

    return { venue: data[0] };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//会場の編集
export const updateVenue = onCall(async (request) => {
  try {
    const { id, venue_name, venue_address } = request.data;

    const { error } = await supabaseAdmin
      .from("venue_master")
      .update({ venue_name, venue_address })
      .eq("id", id);

    if (error) {
      throw new Error(
        "会場変更に失敗しました。。リロードして再度試してください。"
      );
    }
    return {
      message: "successfully",
    };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//会場の削除
export const removeVenue = onCall(async (request) => {
  try {
    const venueId = request.data.id;

    const { error } = await supabaseAdmin
      .from("venue_master")
      .delete()
      .eq("id", venueId);

    if (error) {
      console.error(error);
      throw new Error(
        "会場削除に失敗しました。リロードして再度試してください。"
      );
    }
    return {
      message: "successfully",
    };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//イベント更新
export const updateEvent = onCall(async (request) => {
  try {
    const {
      id,
      venue_id,
      start_date,
      end_date,
      participants_limit,
      registration_fee,
      publish,
    } = request.data;

    const { error: updateError } = await supabaseAdmin
      .from("event_manage")
      .update({
        venue_id,
        start_date,
        end_date,
        participants_limit,
        registration_fee,
        publish,
      })
      .eq("id", id);

    if (updateError) {
      console.error(updateError);
      throw new Error(
        "イベント更新に失敗しました。。リロードして再度試してください。"
      );
    }

    return { message: "successfully" };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

//イベント中止処理
export const cancelEvent = onCall(async (request) => {
  try {
    const { id } = request.data;

    const { error } = await supabaseAdmin
      .from("event_manage")
      .update({
        delete_flag: true,
      })
      .eq("id", id);

    if (error) {
      console.error(error);
      throw new Error(
        "イベントの中止に失敗しました。。リロードして再度試してください。"
      );
    }

    return { message: "successfully" };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期しないエラーが発生しました"
    );
  }
});

async function sendRemind() {
  let errFlag = false;
  try {
    console.log("### リマインドの配信");
    const baseUtcNow = new Date(); // UTCでの現在時刻

    // JSTでの現在日時を得るために9時間足す
    const jstNow = new Date(baseUtcNow.getTime() + 9 * 60 * 60 * 1000);

    // JSTで1日後の0時
    const jstStart = new Date(jstNow);
    jstStart.setHours(0, 0, 0, 0);
    jstStart.setDate(jstStart.getDate() + 1);

    // JSTで1日後の23:59:59.999
    const jstEnd = new Date(jstStart);
    jstEnd.setHours(23, 59, 59, 999);

    // UTCでの値を取得（→サーバーなどに渡す用）
    const start = new Date(jstStart.getTime() - 9 * 60 * 60 * 1000);
    const end = new Date(jstEnd.getTime() - 9 * 60 * 60 * 1000);

    const { data: res, error: remindError } = await supabaseAdmin
      .from("event_manage")
      .select(
        "start_date,end_date,registration_fee,reserve_manage(guest_id,name,cancel_flag),venue_master(venue_name,venue_address)"
      )
      .eq("reserve_manage.cancel_flag", false) // キャンセルされていない
      .gte("start_date", start.toISOString()) // 翌日のイベント
      .lte("start_date", end.toISOString());
    // console.log(res[0])

    if (remindError) {
      console.log(remindError);
      throw new Error("リマインド通知に失敗しました。");
    }
    // console.log("#### リマインド情報", res);
    // console.log("####", typeof res.reserve_manage);

    if (res.length > 0) {
      res.forEach((item) => {
        // console.log("!!!!!", item);
        if (item.reserve_manage.length === 0) return;
        const startDate = dayjs(item.start_date)
          .tz("Asia/Tokyo")
          .format("MM/DD(ddd)HH:mm");
        const endDate = dayjs(item.end_date)
          .tz("Asia/Tokyo")
          .format("MM/DD(ddd)HH:mm");

        const message = {
          type: "text",
          text: `${item.reserve_manage[0].name}様\n\nご予約の【1日前】となりましたので、念のためお知らせ申し上げます。\n\nご予約内容は下記の通りとなります。\n\n🍀予約日時\n${startDate} - ${endDate}\n\n🍀ご予約幸座名\n${item.venue_master.venue_name}\n\n🍀住所\n${item.venue_master.venue_address}\n\n会場をMAPで開く👇\nhttps://www.google.com/maps/search/?api=1&query=${item.venue_master.venue_address}\n\n当日は、ご一緒できるのを楽しみにしております。\nどうぞお気をつけてお越しくださいませ。`,
          wrap: true,
        };

        client
          .pushMessage({
            to: item.reserve_manage[0].guest_id,
            messages: [message],
          })
          .catch((err) => {
            errFlag = true;
            console.log("エラー", err);
          });
      });
    }
    if (errFlag)
      throw new Error(
        "リマインド通知のメッセージ送信に失敗した対象があります。"
      );
    return;
  } catch (err) {
    console.error("sendRemind failed:", err);
    throw err;
  }
}

async function sendVacancyRemind(venueIds) {
  let errFlag = false;
  try {
    if (venueIds === null || venueIds === undefined || venueIds.length === 0)
      return;
    console.log("### 空席情報の配信");
    const baseUtcNow = new Date(); // UTCでの現在時刻

    // JSTでの現在日時を得るために9時間足す
    const jstNow = new Date(baseUtcNow.getTime() + 9 * 60 * 60 * 1000);

    // JSTで2日後の0時
    const jstStart = new Date(jstNow);
    jstStart.setHours(0, 0, 0, 0);
    jstStart.setDate(jstStart.getDate() + 2);

    // JSTで2日後の23:59:59.999
    const jstEnd = new Date(jstStart);
    jstEnd.setHours(23, 59, 59, 999);

    // UTCでの値を取得（→サーバーなどに渡す用）
    const start = new Date(jstStart.getTime() - 9 * 60 * 60 * 1000);
    const end = new Date(jstEnd.getTime() - 9 * 60 * 60 * 1000);

    // 2日後開催予定で空きのあるイベントを取得
    // フラグの条件追加
    const { data: res, error } = await supabaseAdmin.rpc(
      "get_available_events_after",
      {
        from_datetime: start,
        to_datetime: end,
      }
    );

    // console.log(res[0])

    if (error) {
      console.log(error);
      throw new Error("空席情報の配信に失敗しました。");
    }
    // console.log("#### 空席情報", res);

    if (res.length > 0) {
      for (const item of res) {
        if (!venueIds.some((v) => v.venue_id === item.venue_id)) {
          continue;
        }
        // 会場と紐づいているタグを取得
        // そのタグがついている友達(id)を取得
        // user_idに対してメッセージ送信
        // 対象の幸座を予約している人は除外
        const { data: sendTargetIds, error: sendTargetIdsErr } =
          await supabaseAdmin.rpc("get_send_target_ids", {
            p_venue_id: item.venue_id,
            p_event_id: item.id,
          });

        if (sendTargetIdsErr) {
          functions.logger.error(
            "空席情報送信対象のIdが取得できませんでした。",
            sendTargetIdsErr
          );
        }

        // console.log("!!!!!", item);
        if (sendTargetIds.length === 0) return;
        const startDate = dayjs(item.start_date)
          .tz("Asia/Tokyo")
          .format("MM/DD(ddd)HH:mm");
        const endDate = dayjs(item.end_date)
          .tz("Asia/Tokyo")
          .format("MM/DD(ddd)HH:mm");
        const message = {
          type: "text",
          text: `【お知らせ配信】\n空席情報です😄\nーーーーー\n🍀日時\n${startDate} - ${endDate}\n\n🍀幸座名\n${item.venue_name}\n\n🍀住所\n${item.venue_address}\nーーーーー\nご参加お待ちしております♪`,
          wrap: true,
        };
        // console.log("!!!!!対象のuserID", sendTargetIds);
        await Promise.allSettled(
          sendTargetIds.map((user) =>
            client
              .pushMessage({
                to: user.user_id,
                messages: [message],
              })
              .catch((err) => {
                errFlag = true;
                console.log("エラー", err);
              })
          )
        );
      }
    }
    if (errFlag)
      throw new Error("空席情報の通知メッセージ送信に失敗した対象があります。");
    return;
  } catch (err) {
    console.error("sendVacancyRemind failed:", err);
    throw err;
  }
}

export const updateNotification = onCall(async (request) => {
  try {
    const { time, enabled, type } = request.data;

    if (!time || typeof enabled !== "boolean" || !type) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "通知設定に必要なデータが不足しています。"
      );
    }

    const { error } = await supabaseAdmin
      .from("notification_setting")
      .update({
        notification_time: time, // "HH:MM:SS"形式
        enabled: enabled,
      })
      .eq("notification_type", type);

    if (error) {
      console.error("updateNotificationError:", error);
      throw new Error(
        "通知設定の更新に失敗しました。リロードして再度試してください。"
      );
    }

    return { message: "success" };
  } catch (error) {
    console.error("通知設定関数エラー:", error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期せぬエラーが発生しました"
    );
  }
});

export const updateVenueLinkage = onCall(async (request) => {
  try {
    const { notification_type, venueIds } = request.data;

    if (!notification_type || !Array.isArray(venueIds)) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "必要なデータが不足しています"
      );
    }

    // 既存リンクを削除
    const { error: deleteError } = await supabaseAdmin
      .from("venue_notification_linkage")
      .delete()
      .eq("notification_type", notification_type);

    if (deleteError) {
      console.error("削除エラー:", deleteError);
      throw new Error("既存リンクの削除に失敗しました");
    }

    // venueIdsが空なら挿入スキップ（正常終了とみなす）
    if (venueIds.length === 0) return { message: "deleted only" };

    const insertData = venueIds.map((venueId) => ({
      venue_id: venueId,
      notification_type: notification_type,
    }));

    const { error: insertError } = await supabaseAdmin
      .from("venue_notification_linkage")
      .insert(insertData);

    if (insertError) {
      console.error("挿入エラー:", insertError);
      throw new Error("リンクの保存に失敗しました");
    }

    return { message: "success" };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期せぬエラーが発生しました"
    );
  }
});

export const fetchVenueLinkage = onCall(async (request) => {
  try {
    const { notification_type } = request.data;

    if (!notification_type) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "通知タイプが指定されていません"
      );
    }

    const { data, error } = await supabaseAdmin
      .from("venue_notification_linkage")
      .select("venue_id")
      .eq("notification_type", notification_type);

    if (error) {
      console.error("取得エラー:", error);
      throw new Error("会場リンク情報の取得に失敗しました");
    }

    const venueIds = data.map((item) => item.venue_id);
    return { venueIds };
  } catch (error) {
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError(
      "internal",
      error.message || "予期せぬエラーが発生しました"
    );
  }
});

// export const createUser = functions.https.onRequest(
//   async (request, response) => {
//     const body = request.body;
//     console.log("### body:", body);

//     try {
//       const { data, error } = await supabaseAdmin.auth.admin.createUser({
//         email: body.email,
//         password: body.password,
//         email_confirm: true,
//         // user_metadata: {
//         //   name: body.name,
//         //   role: body.role,
//         //   state: 2,
//         // },
//       });

//       if (error) {
//         throw new Error("failed create user.");
//       }

//       // console.log("user", data);

//       // const res = await supabaseAdmin.from("member").insert({
//       //   uuid: data.user.id,
//       //   email: body.email,
//       //   name: body.name,
//       //   application_status: 1,
//       // });

//       // if (res.error) {
//       //   console.log(res.error);
//       //   throw new Error("failed create user.");
//       // }

//       // console.log(res.data);

//       response.status(200).send(data);
//     } catch (e) {
//       console.error(e);
//       response.status(400).send(e);
//     }
//   }
// );