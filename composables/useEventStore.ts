// composables/useEventStore.ts
export const useEventStore = () => {
  const venue = useState<string>("event-venue", () => "");
  const date = useState<Date | null>("event-date", () => null);
  const start = useState<Date | null>("event-start", () => null);
  const fee = useState<string | null>("event-fee", () => null);
  const note = useState<string | null>("event-note", () => null);
  const cancelFlag = useState<boolean | null>("event-cancel-flag", () => null);

  const setEvent = (payload: {
    venue: string;
    date: Date;
    start: Date;
    fee: string;
    note: string;
    cancelFlag: boolean;
  }) => {
    venue.value = payload.venue;
    date.value = payload.date;
    start.value = payload.start;
    fee.value = payload.fee;
    note.value = payload.note;
    cancelFlag.value = payload.cancelFlag;
  };

  const reset = () => {
    venue.value = "";
    date.value = null;
    start.value = null;
    fee.value = null;
    note.value = null;
    cancelFlag.value = null;
  };

  return {
    venue,
    date,
    start,
    fee,
    note,
    cancelFlag,
    setEvent,
    reset,
  };
};
