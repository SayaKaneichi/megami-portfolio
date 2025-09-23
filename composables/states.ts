// ローディング
type LoadingState = {
  isLoading: boolean;
};

export const useLoadingStore = () => {
  const state = useState<LoadingState>("loading", () => ({
    isLoading: false,
  }));
  return {
    state: readonly(state),
    setBeginLoaging: setBeginLoaging(state),
    setStopLoaging: setStopLoaging(state),
  };
};

const setBeginLoaging = (state: Ref<LoadingState>) => {
  return () => (state.value.isLoading = true);
};

const setStopLoaging = (state: Ref<LoadingState>) => {
  return () => (state.value.isLoading = false);
};

// 認証関連
type AuthState = {
  isLogin: boolean;
};

export const useAuthStore = () => {
  const state = useState<AuthState>("login", () => ({
    isLogin: false,
  }));
  return {
    state: readonly(state),
    setLoginState: setLoginState(state),
  };
};

const setLoginState = (state: Ref<AuthState>) => {
  return (value: boolean) => {
    state.value.isLogin = value;
  };
};
