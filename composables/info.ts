type InfoState = {
  message: string;
}

export const useInfoStore = () => {
  const state = useState<InfoState>("info", () => ({
    message: '',
  }))
  return {
    state: readonly(state),
    existsInfoMessage: existsInfoMessage(state),
    setInfoMessage: setInfoMessage(state),
    clearInfoMessage: clearInfoMessage(state),
  }
}

const existsInfoMessage = (state:Ref<InfoState>) => {
  return () => !!state.value.message
}

const setInfoMessage = (state: Ref<InfoState>) => {
  return (message: string) => (state.value.message = message)
};

const clearInfoMessage = (state: Ref<InfoState>) => {
  return () => (state.value.message = '')
};