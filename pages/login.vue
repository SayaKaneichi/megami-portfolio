<template>
  <v-container class="bg-white" fluid>
    <v-card class="mx-auto px-6 py-8 mt-16" max-width="344">
      <v-text-field
        v-model="email"
        class="mb-8"
        type="email"
        placeholder="メールアドレス"
        clearable
      ></v-text-field>

      <v-text-field
        v-model="pass"
        placeholder="パスワード"
        class="mb-8"
        type="password"
        clearable
        required
      ></v-text-field>
      <br />
      <v-btn
        color="blue-lighten-1"
        size="large"
        type="submit"
        variant="elevated"
        block
        @click="login()"
      >
        ログイン
      </v-btn>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const email = ref();
const pass = ref();

async function login() {
  try{
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: pass.value,
    })
    console.log(data)
    if (error) {
      throw error
    }
  }
  catch(error){
    console.log(error);
  }
  console.log(email.value,pass.value);
}

</script>
