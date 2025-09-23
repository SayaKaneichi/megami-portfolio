export const validationRules = {
  // 半角数字チェック
  isInteger: (value: string | null): true | string =>
    value === "" || value === null
      ? true
      : value.match(/^0$|^[1-9]+[0-9]*$/) !== null
        ? true
        : "半角数字で入力してください",

  // 必須チェック
  isRequired: (value: string | null): true | string =>
    !!value || "入力が必須の項目です",

  // メールアドレスの形式チェック
  isEmail: (value: string | null): true | string =>
    value === "" || value === null
      ? true
      : /^[a-zA-Z0-9_+-]+(\.[a-zA-Z0-9_+-]+)*@([a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.)+[a-zA-Z]{2,}$/.test(
            value
          )
        ? true
        : "正しい形式でメールアドレスを入力してください",

  isPassword: (value: string | null): true | string =>
    !value || value.length >= 6 ? true : "6文字以上で設定してください",
};
