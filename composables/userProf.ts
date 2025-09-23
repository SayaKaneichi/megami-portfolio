// Lineプロフィール情報
type PropState = {
  userId: string | null;
  username: string | null;
};

export const useUserProfileStore = () => {
  const state = useState<PropState>("userProfile", () => ({
    userId: null,
    username: null,
  }));
  return {
    state: readonly(state),
    setUserProfileState: setUserProfileState(state),
  };
};

const setUserProfileState = (state: Ref<PropState>) => {
  return (value: Partial<PropState>) => {
    state.value = { ...state.value, ...value };
  };
};
