// stores/signup.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSignupStore = defineStore('signup', () => {
  const signupData = ref({
    loginId: '',
    password: '',
    passwordCheck: '',
    name: '',
    email: '',
    emailCode: '',
    phone: '',
    birth: '',
    transactionPassword: '',
    transactionPasswordCheck: ''
  })

  const setSignupData = (data) => {
    signupData.value = { ...signupData.value, ...data }
  }

  const clearSignupData = () => {
    signupData.value = {
      loginId: '',
      password: '',
      passwordCheck: '',
      name: '',
      email: '',
      emailCode: '',
      phone: '',
      birth: '',
      transactionPassword: '',
      transactionPasswordCheck: ''
    }
  }

  return { signupData, setSignupData, clearSignupData }
})
