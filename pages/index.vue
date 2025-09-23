<template>
  <v-container class="pa-6">
    <v-btn color="primary">Hello Vuetify</v-btn>
  </v-container>

  <pre>{{ data }}</pre>
  
</template>

<script setup lang="ts">
const supabase = useSupabaseClient()
const { data, error } = await supabase
  .from('tag_master')
  .select()
  console.log(data)

  if(error){
      console.log(error)
    }
  
</script>
