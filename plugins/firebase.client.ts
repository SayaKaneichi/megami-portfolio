import { initializeApp } from 'firebase/app'
import {
  httpsCallable,
  getFunctions,
  connectFunctionsEmulator,
} from 'firebase/functions'
//import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
//import { getStorage, connectStorageEmulator } from "firebase/storage";
// import { getAuth, connectAuthEmulator } from "firebase/auth";

import { defineNuxtPlugin } from '#app'

// plugIn呼び出し時に型エラーunknownとなる問題に対する対策
// 参考) https://stackoverflow.com/questions/75834879/nuxt-3-usenuxtapp-returns-type-unknown
// declare module '#app' {
//   interface NuxtApp {
//     $httpsCallable: (api: string, data: unknown) => Promise<any>
//   }
// }

export default defineNuxtPlugin((nuxtApp) => {
  // Your web app's Firebase configuration
  const firebaseConfig = {
  apiKey: "AIzaSyA4AH79SutL_Wrjt3ggNDm-Pz4_hCspkI8",
  authDomain: "megamiportfolio.firebaseapp.com",
  projectId: "megamiportfolio",
  storageBucket: "megamiportfolio.firebasestorage.app",
  messagingSenderId: "441283605245",
  appId: "1:441283605245:web:e08b0c15ac918af2fd8494"
  };
  initializeApp(firebaseConfig)

  // let baseURL = "https://us-central1-hisyokong.cloudfunctions.net/prod/";

  const isEmulating = window.location.hostname === 'localhost'
  if (isEmulating) {
    const functions = getFunctions()
    connectFunctionsEmulator(functions, 'localhost', 5002)
  }

  const firebaseApp = initializeApp(firebaseConfig)
  // const db = getFirestore(firebaseApp);
  const functions = getFunctions(firebaseApp)
  const callable = async (api: string, data: unknown) => {
    const func = httpsCallable(functions, api)
    return await func(data)
      .then((result) => result)
      .catch((err) => {
        console.error(err)
        throw err
      })
  }

  nuxtApp.provide('httpsCallable', callable)
  nuxtApp.provide('functions', functions)
})
