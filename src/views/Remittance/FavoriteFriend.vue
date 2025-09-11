<template>
    <div class="favorites-page">
        <div class="page-header">
            <h2 class="page-title">친구 즐겨찾기</h2>
            <button class="manage-btn" @click="toggleManageMode">
                {{ isManagingFavorites ? '완료' : '관리' }}
            </button>
        </div>

        <!-- 로딩 상태 -->
        <div v-if="isLoading" class="loading-container">
            <div class="loading-spinner">로딩 중...</div>
        </div>

        <div v-else class="favorites-content">
            <!-- 즐겨찾기 목록 -->
            <div class="favorite-accounts-card">
                <div class="favorite-accounts-list">
                    <div v-for="account in favoriteAccounts" :key="account.favoriteId" 
                         class="favorite-account-item"
                         :class="{ 'manage-mode': isManagingFavorites }"
                         @click="!isManagingFavorites && openTransferModal(account)">
                        <div class="account-avatar">
                            <span class="avatar-icon">{{ account.icon }}</span>
                        </div>
                        <div class="account-details">
                            <div class="account-name">{{ account.realName }}</div>
                            <div class="account-info">
                                <!-- ✅ 전화번호 포맷팅 적용 -->
                                <span class="account-number">{{ formatPhoneNumberDisplay(account.phoneNumber) }}</span>
                            </div>
                            <div class="last-transfer">{{ account.lastTransfer }}</div>
                        </div>
                        <div class="quick-actions">
                            <button v-if="!isManagingFavorites" class="quick-transfer-btn"
                                    @click.stop="openTransferModal(account)">
                                💸 송금
                            </button>
                            <button v-else class="delete-btn" @click.stop="deleteFavorite(account.favoriteId)">
                                🗑️삭제
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 즐겨찾기가 없을 때 -->
                <div v-if="favoriteAccounts.length === 0" class="no-favorites">
                    <div class="no-favorites-icon">👥</div>
                    <div class="no-favorites-text">등록된 즐겨찾기가 없습니다</div>
                    <div class="no-favorites-desc">자주 송금하는 친구를 추가해보세요</div>
                </div>

                <!-- 친구 추가 버튼 -->
                <button v-if="favoriteAccounts.length < 4" class="add-favorite-btn" @click="openAddModal">
                    + 자주 송금하는 친구 추가
                </button>
                <div v-else class="max-favorites-notice">
                    최대 4명까지 등록 가능합니다
                </div>
            </div>
        </div>

        <!-- 친구 추가 모달 -->
        <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
            <div class="modal-content" @click.stop>
                <div class="modal-header">
                    <h3>친구 추가</h3>
                    <button class="close-btn" @click="closeAddModal">×</button>
                </div>

                <form @submit.prevent="addFriend" class="add-friend-form">
                    <div class="form-group">
                        <label for="friendName">친구 이름</label>
                        <input type="text" id="friendName" v-model="newFriend.name" 
                               placeholder="친구 이름을 입력하세요"
                               :class="{ error: errors.name }" required>
                        <span v-if="errors.name" class="error-message">{{ errors.name }}</span>
                    </div>

                    <div class="form-group">
                        <label for="friendPhone">전화번호</label>
                        <input type="tel" id="friendPhone" v-model="newFriend.phoneNumber"
                               placeholder="전화번호를 입력하세요 (예: 010-1234-5678)" 
                               :class="{ error: errors.phoneNumber }"
                               maxlength="13" @input="formatPhoneNumber" required>
                        <span v-if="errors.phoneNumber" class="error-message">{{ errors.phoneNumber }}</span>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" @click="closeAddModal">취소</button>
                        <button type="submit" class="confirm-btn" :disabled="isVerifying">
                            {{ isVerifying ? '확인 중...' : '추가' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- 송금 모달 -->
        <div v-if="showTransferModal" class="modal-overlay" @click="closeTransferModal">
            <div class="modal-content transfer-modal" @click.stop>
                <div class="modal-header">
                    <h3>{{ selectedAccount?.realName }}에게 송금</h3>
                    <button class="close-btn" @click="closeTransferModal">×</button>
                </div>

                <div class="transfer-form">
                    <!-- 통화 선택 -->
                    <div class="form-group">
                        <label>송금할 통화 선택</label>
                        <div class="currency-selection">
                            <div v-for="wallet in availableWallets" :key="wallet.code" 
                                 class="currency-card"
                                 :class="{ selected: selectedCurrency === wallet.code }" 
                                 @click="selectCurrency(wallet)">
                                <div class="currency-info">
                                    <span class="currency-flag">{{ wallet.flag }}</span>
                                    <div class="currency-details">
                                        <div class="currency-name">{{ wallet.name }}</div>
                                        <div class="currency-code">{{ wallet.code }}</div>
                                    </div>
                                </div>
                                <div class="currency-balance">
                                    <div class="balance-amount">
                                        {{ formatCurrencyAmount(wallet.amount, wallet.code) }}
                                    </div>
                                    <div class="balance-krw">
                                        {{ formatAmount(convertToKRW(wallet.amount, wallet.exchangeRate)) }}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- ✅ 송금 금액 입력 - 포맷팅 적용 -->
                    <div class="form-group">
                        <label>송금 금액</label>
                        <div class="amount-input-container">
                            <input type="text" 
                                   v-model="formattedTransferAmount"
                                   :placeholder="`${selectedCurrency}로 입력`"
                                   class="amount-input" 
                                   @input="handleTransferAmountInput"
                                   @focus="handleTransferAmountFocus"
                                   @blur="handleTransferAmountBlur">
                            <span class="currency-symbol">{{ selectedCurrency }}</span>
                        </div>
                        <div class="balance-info">
                            사용 가능한 잔액: {{ formatCurrencyAmount(selectedWalletBalance, selectedCurrency) }}
                        </div>
                        <div v-if="transferAmount && parseFloat(transferAmount) > selectedWalletBalance"
                             class="error-message">
                            잔액이 부족합니다
                        </div>
                    </div>

                    <!-- 계좌 비밀번호 입력 -->
                    <div class="form-group">
                        <label>계좌 비밀번호</label>
                        <input type="password" 
                               v-model="accountPassword" 
                               placeholder="••••"
                               class="password-input" 
                               :class="{ error: passwordError }"
                               maxlength="4" 
                               pattern="[0-9]{4}" 
                               @input="validatePassword" 
                               ref="passwordInput"
                               required>
                        <div class="password-dots">
                            <span v-for="i in 4" :key="i" class="password-dot"
                                  :class="{ filled: accountPassword.length >= i }"></span>
                        </div>
                        <div v-if="passwordError" class="error-message">{{ passwordError }}</div>
                    </div>

                    <!-- 송금 확인 정보 -->
                    <div v-if="transferAmount && selectedCurrency && accountPassword.length === 4"
                         class="transfer-summary">
                        <div class="summary-title">송금 정보</div>
                        <div class="summary-row">
                            <span>받는 사람</span>
                            <span>{{ selectedAccount?.realName }}</span>
                        </div>
                        <div class="summary-row">
                            <span>송금 금액</span>
                            <span>{{ formatCurrencyAmount(parseFloat(transferAmount), selectedCurrency) }}</span>
                        </div>
                        <div class="summary-row">
                            <span>수수료</span>
                            <span class="free">무료</span>
                        </div>
                        <div class="summary-row total">
                            <span>총 차감 금액</span>
                            <span>{{ formatCurrencyAmount(parseFloat(transferAmount), selectedCurrency) }}</span>
                        </div>
                    </div>

                    <!-- 송금 버튼 -->
                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" @click="closeTransferModal">취소</button>
                        <button type="button" class="confirm-btn transfer-confirm-btn" 
                                :disabled="!canTransfer" @click="confirmTransfer">
                            {{ isTransferring ? '송금 중...' : '송금하기' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import axios from 'axios'

export default {
    name: 'FavoritesPage',
    setup() {
        const router = useRouter()
        const authStore = useAuthStore()
        
        // 상태 관리
        const isLoading = ref(true)
        const isTransferring = ref(false)
        const isManagingFavorites = ref(false)
        
        // 친구 추가 모달 관련 상태
        const showAddModal = ref(false)
        const isVerifying = ref(false)
        const newFriend = ref({
            name: '',
            phoneNumber: ''
        })
        const errors = ref({
            name: '',
            phoneNumber: ''
        })
        
        // 전화번호 전달용 
        const rawPhone = ref('')
        
        // 송금 모달 관련 상태
        const showTransferModal = ref(false)
        const selectedAccount = ref(null)
        const selectedCurrency = ref('KRW')
        const transferAmount = ref('')
        const formattedTransferAmount = ref('') // ✅ 포맷팅된 송금 금액
        const accountPassword = ref('')
        const passwordError = ref('')
        const passwordInput = ref(null) // ✅ 비밀번호 입력 필드 ref 추가
        
        // 데이터
        const favoriteAccounts = ref([])
        const balanceData = ref([])
        const exchangeRates = ref({})
        const userId = localStorage.getItem('userId')
        
        // API 설정
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
        
        // Axios 기본 설정
        axios.defaults.baseURL = API_BASE_URL
        axios.defaults.withCredentials = true

        // ✅ 숫자 포맷팅 함수
        const formatNumber = (number) => {
            if (!number || isNaN(number)) return '0'
            return new Intl.NumberFormat('ko-KR').format(number)
        }

        // ✅ 송금 금액 입력 처리
        const handleTransferAmountInput = (event) => {
            let value = event.target.value.replace(/[^0-9.]/g, '')
            
            // 소수점 처리
            const parts = value.split('.')
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('')
            }
            
            // 숫자로 변환
            const numValue = parseFloat(value) || 0
            const maxAmount = selectedWalletBalance.value
            
            // 최대 금액 제한
            if (numValue > maxAmount) {
                transferAmount.value = maxAmount
                formattedTransferAmount.value = formatNumber(maxAmount)
            } else {
                transferAmount.value = numValue
                formattedTransferAmount.value = numValue ? formatNumber(numValue) : ''
            }
        }

        // ✅ 포커스 시 포맷팅 해제
        const handleTransferAmountFocus = () => {
            if (transferAmount.value) {
                formattedTransferAmount.value = transferAmount.value.toString()
            }
        }

        // ✅ 포커스 아웃 시 포맷팅 적용
        const handleTransferAmountBlur = () => {
            if (transferAmount.value) {
                formattedTransferAmount.value = formatNumber(transferAmount.value)
            }
        }
        
        // API 함수들
        const api = {
            // 즐겨찾기 목록 조회
            async getFavorites() {
                try {
                    const response = await axios.get('/api/favorites')
                    return response.data
                } catch (error) {
                    console.error('Favorites API Error:', error)
                    throw error
                }
            },
            
            // 즐겨찾기 추가
            async addFavorite(friendData) {
                try {
                    const response = await axios.post('/api/favorites', friendData)
                    return response.data
                } catch (error) {
                    console.error('Add Favorite API Error:', error)
                    throw error
                }
            },
            
            // 즐겨찾기 삭제
            async deleteFavorite(favoriteId) {
                try {
                    await axios.delete(`/api/favorites/${favoriteId}`)
                } catch (error) {
                    console.error('Delete Favorite API Error:', error)
                    throw error
                }
            },
            
            // 사용자 잔액 조회
            async getUserBalances(userId) {
                try {
                    const response = await axios.get(`/api/balance/${userId}`)
                    return response.data
                } catch (error) {
                    console.error('Balance API Error:', error)
                    throw error
                }
            },
            
            // 특정 통화의 실시간 환율 조회
            async getExchangeRate(currencyCode) {
                try {
                    const response = await axios.get(`/api/exchange/realtime/${currencyCode}`)
                    const rateData = response.data
                    
                    if (rateData && rateData.length > 0 && rateData[0].base_rate) {
                        const baseRateStr = rateData[0].base_rate
                        const cleanRate = baseRateStr.replace(/,/g, '')
                        let rate = parseFloat(cleanRate)
                        
                        // JPY는 100단위 통화이므로 환율을 100으로 나눔
                        if (currencyCode === 'JPY') {
                            rate = rate / 100
                        }
                        return rate
                    }
                    
                    // 기본값 반환
                    return currencyCode === 'KRW' ? 1 : (currencyCode === 'JPY' ? 9.4 : 1300)
                } catch (error) {
                    console.error(`Exchange Rate API Error for ${currencyCode}:`, error)
                    return currencyCode === 'KRW' ? 1 : (currencyCode === 'JPY' ? 9.4 : 1300)
                }
            },
            
            // 송금 실행
            async executeTransfer(transferData) {
                try {
                    const response = await axios.post('/api/transfer/execute', transferData, {
                        headers: {
                            'X-User-Id': userId
                        }
                    })
                    return response.data
                } catch (error) {
                    console.error('Transfer API Error:', error)
                    throw error
                }
            }
        }
        
        // 환율 정보 로드
        const loadExchangeRates = async (currencyCodes) => {
            const ratePromises = currencyCodes.map(async (code) => {
                if (code === 'KRW') {
                    return { code, rate: 1 }
                }
                
                try {
                    const rate = await api.getExchangeRate(code)
                    return { code, rate }
                } catch (error) {
                    console.error(`Failed to load exchange rate for ${code}:`, error)
                    return { code, rate: code === 'JPY' ? 9.4 : 1300 }
                }
            })
            
            const rates = await Promise.all(ratePromises)
            const rateMap = {}
            rates.forEach(({ code, rate }) => {
                rateMap[code] = rate
            })
            
            exchangeRates.value = rateMap
        }
        
        // Computed Properties
        const currencyWallets = computed(() => {
            return balanceData.value.map(balance => {
                const exchangeRate = exchangeRates.value[balance.code] || 1
                const krwAmount = convertToKRW(balance.amount, exchangeRate)
                
                return {
                    code: balance.code,
                    name: balance.name,
                    amount: balance.amount,
                    flag: balance.flag,
                    exchangeRate: exchangeRate,
                    krwAmount: krwAmount
                }
            })
        })
        
        // 송금 가능한 지갑
        const availableWallets = computed(() => {
            return currencyWallets.value.filter(wallet => parseCleanFloat(wallet.amount) > 0)
        })
        
        // 선택된 통화의 잔액
        const selectedWalletBalance = computed(() => {
            const wallet = currencyWallets.value.find(w => w.code === selectedCurrency.value)
            return wallet ? parseCleanFloat(wallet.amount) : 0
        })
        
        // 송금 가능 여부
        const canTransfer = computed(() => {
            const amount = parseFloat(transferAmount.value)
            return amount > 0 &&
                   amount <= selectedWalletBalance.value &&
                   selectedAccount.value &&
                   accountPassword.value.length === 4 &&
                   !passwordError.value &&
                   !isTransferring.value
        })
        
        // 데이터 로드 함수들
        const loadFavorites = async () => {
            try {
                const data = await api.getFavorites()
                favoriteAccounts.value = data
            } catch (error) {
                console.error('Failed to load favorites:', error)
            }
        }
        
        const loadBalanceData = async () => {
            try {
                const data = await api.getUserBalances(userId)
                balanceData.value = Array.isArray(data) ? data : []
                
                const currencyCodes = balanceData.value.map(item => item.code)
                if (currencyCodes.length > 0) {
                    await loadExchangeRates(currencyCodes)
                }
            } catch (error) {
                console.error('Failed to load balance data:', error)
                balanceData.value = []
                exchangeRates.value = { 'KRW': 1 }
            }
        }
        
        // 초기 데이터 로드
        const loadInitialData = async () => {
            isLoading.value = true
            try {
                await Promise.all([
                    loadFavorites(),
                    loadBalanceData()
                ])
            } catch (error) {
                console.error('Failed to load initial data:', error)
            } finally {
                isLoading.value = false
            }
        }
        
        // 이벤트 핸들러들
        const toggleManageMode = () => {
            isManagingFavorites.value = !isManagingFavorites.value
        }
        
        const deleteFavorite = async (favoriteId) => {
            if (confirm('정말로 즐겨찾기에서 삭제하시겠습니까?')) {
                try {
                    await api.deleteFavorite(favoriteId)
                    await loadFavorites()
                    alert('즐겨찾기에서 삭제되었습니다.')
                } catch (error) {
                    if (error.response?.data?.message) {
                        alert(error.response.data.message)
                    } else {
                        alert('삭제 중 오류가 발생했습니다.')
                    }
                }
            }
        }
        
        const validatePassword = () => {
            const password = accountPassword.value
            if (password.length > 0 && !/^\d+$/.test(password)) {
                passwordError.value = '숫자만 입력 가능합니다'
            } else if (password.length > 4) {
                accountPassword.value = password.slice(0, 4)
                passwordError.value = ''
            } else {
                passwordError.value = ''
            }
        }
        
        const formatPhoneNumber = (event) => {
            let value = event.target.value.replace(/\D/g, '')
            
            if (value.length <= 3) {
                value = value
            } else if (value.length <= 7) {
                value = value.slice(0, 3) + '-' + value.slice(3)
            } else {
                value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7, 11)
            }
            newFriend.value.phoneNumber = value
            rawPhone.value = value.replace(/\D/g, '').slice(0, 11)
        }

        // 전화번호 표시용 포맷팅 함수 (DB에서 가져온 데이터용)
        const formatPhoneNumberDisplay = (phoneNumber) => {
            if (!phoneNumber) return ''
            
            // 숫자만 추출
            const numbers = phoneNumber.replace(/\D/g, '')
            
            // 11자리 휴대폰 번호 포맷팅
            if (numbers.length === 11 && numbers.startsWith('010')) {
                return numbers.slice(0, 3) + '-' + numbers.slice(3, 7) + '-' + numbers.slice(7, 11)
            }
            
            // 10자리 일반 전화번호 포맷팅 (예: 02-1234-5678)
            if (numbers.length === 10) {
                if (numbers.startsWith('02')) {
                    return numbers.slice(0, 2) + '-' + numbers.slice(2, 6) + '-' + numbers.slice(6, 10)
                } else {
                    return numbers.slice(0, 3) + '-' + numbers.slice(3, 6) + '-' + numbers.slice(6, 10)
                }
            }
            
            // 9자리 전화번호 포맷팅 (예: 031-123-4567)
            if (numbers.length === 9) {
                return numbers.slice(0, 3) + '-' + numbers.slice(3, 6) + '-' + numbers.slice(6, 9)
            }
            
            // 기본 포맷팅이 적용되지 않는 경우 원본 반환
            return phoneNumber
        }
        
        // 모달 관리
        const openAddModal = () => {
            showAddModal.value = true
            resetForm()
        }
        
        const closeAddModal = () => {
            showAddModal.value = false
            resetForm()
        }
        
        const openTransferModal = (account) => {
            selectedAccount.value = account
            selectedCurrency.value = 'KRW'
            transferAmount.value = ''
            formattedTransferAmount.value = '' // ✅ 초기화
            accountPassword.value = ''
            passwordError.value = ''
            showTransferModal.value = true
        }
        
        const closeTransferModal = () => {
            showTransferModal.value = false
            selectedAccount.value = null
            selectedCurrency.value = 'KRW'
            transferAmount.value = ''
            formattedTransferAmount.value = '' // ✅ 초기화
            accountPassword.value = ''
            passwordError.value = ''
        }
        
        const selectCurrency = (wallet) => {
            selectedCurrency.value = wallet.code
        }
        
        // 친구 추가
        const addFriend = async () => {
            errors.value = {
                name: '',
                phoneNumber: ''
            }
            
            if (!newFriend.value.name.trim()) {
                errors.value.name = '친구 이름을 입력해주세요'
                return
            }
            
            if (!newFriend.value.phoneNumber.trim()) {
                errors.value.phoneNumber = '전화번호를 입력해주세요'
                return
            }
            
            if (!validatePhoneNumber(newFriend.value.phoneNumber)) {
                errors.value.phoneNumber = '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
                return
            }
            
            isVerifying.value = true
            try {
                const friendData = {
                    name: newFriend.value.name.trim(),
                    phoneNumber: rawPhone.value
                }
                
                await api.addFavorite(friendData)
                await loadFavorites()
                alert(`${friendData.name}님이 즐겨찾기에 추가되었습니다!`)
                closeAddModal()
                
            } catch (error) {
                if (error.response?.status === 400 || error.response?.status === 404) {
                    const message = error.response.data.message || '잘못된 요청입니다.'
                    if (message.includes('사용자를 찾을 수 없습니다') || message.includes('등록되지 않은 사용자')) {
                        errors.value.name = '등록되지 않은 사용자입니다'
                    } else if (message.includes('이미 즐겨찾기') || message.includes('중복')) {
                        errors.value.name = '이미 즐겨찾기에 등록된 친구입니다'
                    } else if (message.includes('최대') || message.includes('4명')) {
                        alert('최대 4명까지만 등록할 수 있습니다')
                    } else {
                        alert(message)
                    }
                }
                else {
                    alert('친구 추가 중 오류가 발생했습니다. 다시 시도해주세요.')
                }
            } finally {
                isVerifying.value = false
            }
        }
        
        // ✅ 수정된 송금 확인 함수 - success 필드 체크 추가
        const confirmTransfer = async () => {
            if (!canTransfer.value) return
            
            const transferData = {
                recipientName: selectedAccount.value.realName,
                recipientPhone: selectedAccount.value.phoneNumber,
                fromCurrencyCode: selectedCurrency.value,
                toCurrencyCode: selectedCurrency.value,
                sendAmount: parseFloat(transferAmount.value),
                transactionPassword: accountPassword.value
            }
            
            if (confirm(`${selectedAccount.value.realName}님에게 ${formatCurrencyAmount(transferData.sendAmount, selectedCurrency.value)}를 송금하시겠습니까?`)) {
                isTransferring.value = true
                passwordError.value = ''
                
                try {
                    const result = await api.executeTransfer(transferData)
                    
                    // ✅ success 필드 확인 추가
                    if (result.success) {
                        await Promise.all([
                            loadBalanceData(),
                            loadFavorites()
                        ])
                        
                        alert('송금이 완료되었습니다!')
                        closeTransferModal()
                    } else {
                        // ✅ success: false인 경우 처리
                        const message = result.message || '송금에 실패했습니다.'
                        
                        if (message.includes('거래 비밀번호') || 
                            message.includes('비밀번호') || 
                            message.includes('password')) {
                            
                            passwordError.value = '계좌 비밀번호가 올바르지 않습니다'
                            alert('계좌 비밀번호가 올바르지 않습니다. 다시 입력해주세요.')
                            accountPassword.value = '' // 비밀번호 초기화
                            
                            // 비밀번호 입력란에 포커스
                            setTimeout(() => {
                                if (passwordInput.value) {
                                    passwordInput.value.focus()
                                }
                            }, 100)
                        } else {
                            alert(message)
                        }
                    }
                    
                } catch (error) {
                    console.error('Network Error:', error)
                    alert('송금 중 네트워크 오류가 발생했습니다.')
                } finally {
                    isTransferring.value = false
                }
            }
        }
        
        const resetForm = () => {
            newFriend.value = {
                name: '',
                phoneNumber: ''
            }
            errors.value = {
                name: '',
                phoneNumber: ''
            }
        }
        
        const validatePhoneNumber = (phoneNumber) => {
            const phoneRegex = /^010-\d{4}-\d{4}$/
            return phoneRegex.test(phoneNumber)
        }
        
        // 헬퍼 함수들
        const parseCleanFloat = (value) => {
            if (typeof value === 'number') return value
            if (typeof value === 'string') {
                return parseFloat(value.replace(/,/g, ''))
            }
            return parseFloat(value) || 0
        }
        
        const formatAmount = (amount) => {
            return new Intl.NumberFormat('ko-KR').format(Math.floor(amount)) + '원'
        }
        
        const formatCurrencyAmount = (amount, currency) => {
            const cleanAmount = parseCleanFloat(amount)
            
            if (currency === 'KRW') {
                return new Intl.NumberFormat('ko-KR').format(Math.floor(cleanAmount)) + '원'
            }
            return new Intl.NumberFormat('ko-KR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(cleanAmount) + ' ' + currency
        }
        
        const convertToKRW = (amount, rate) => {
            const cleanAmount = parseCleanFloat(amount)
            const result = Math.floor(cleanAmount * rate)
            return result
        }
        
        // 컴포넌트 마운트
        onMounted(() => {
            // auth store에서 토큰 로드 및 axios 헤더 자동 설정
            authStore.getToken()
            loadInitialData()
        })
        
        return {
            // 상태
            isLoading,
            isTransferring,
            isManagingFavorites,
            favoriteAccounts,
            showAddModal,
            newFriend,
            errors,
            isVerifying,
            showTransferModal,
            selectedAccount,
            selectedCurrency,
            transferAmount,
            formattedTransferAmount, // ✅ 추가
            accountPassword,
            passwordError,
            passwordInput, // ✅ 추가
            availableWallets,
            selectedWalletBalance,
            canTransfer,
            
            // 메소드
            toggleManageMode,
            deleteFavorite,
            validatePassword,
            formatPhoneNumber,
            formatPhoneNumberDisplay,
            handleTransferAmountInput, // ✅ 추가
            handleTransferAmountFocus,  // ✅ 추가 
            handleTransferAmountBlur,   // ✅ 추가
            openAddModal,
            closeAddModal,
            openTransferModal,
            closeTransferModal,
            selectCurrency,
            addFriend,
            confirmTransfer,
            formatAmount,
            formatCurrencyAmount,
            convertToKRW
        }
    }
}
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

.favorites-page {
    min-height: 80vh;
    background-color: #f8f9fa;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    background: white;
    padding: 1.5rem 2rem;
    border-radius: 16px;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    max-width: 800px;
    margin-left: auto;
    margin-right: auto;
    margin-bottom: 2rem;
}

.page-title {
    font-size: 1.75rem;
    font-weight: 600;
    color: #333;
}

.manage-btn {
    background: none;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    color: #20c997;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
}

.manage-btn:hover {
    background-color: #20c997;
    color: white;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 400px;
    gap: 1rem;
}

.loading-spinner {
    font-size: 1.2rem;
    color: #20c997;
    font-weight: 600;
}

.favorites-content {
    max-width: 800px;
    margin: 0 auto;
}

.favorite-accounts-card {
    background: white;
    padding: 2rem;
    border-radius: 16px;
    border: 1px solid #e9ecef;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.favorite-accounts-list {
    margin-bottom: 1.5rem;
}

.favorite-account-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border-radius: 12px;
    background: #f8f9fa;
    margin-bottom: 0.75rem;
    transition: all 0.2s;
    cursor: pointer;
}

.favorite-account-item:hover {
    background: #e9ecef;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.favorite-account-item.manage-mode {
    background: #fff3cd !important;
    border: 1px solid #ffeaa7;
}

.favorite-account-item.manage-mode:hover {
    background: #fff3cd !important;
}

.account-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.account-details {
    flex: 1;
}

.account-name {
    font-weight: 600;
    color: #333;
    margin-bottom: 0.25rem;
    font-size: 1rem;
}

.account-info {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
}

.account-number {
    font-size: 0.85rem;
    color: #6c757d;
}

.last-transfer {
    font-size: 0.8rem;
    color: #6c757d;
    font-weight: 500;
}

.quick-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
}

.quick-transfer-btn {
    background: #20c997;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
}

.quick-transfer-btn:hover {
    background: #17a2b8;
    transform: scale(1.05);
}

.delete-btn {
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
}

.delete-btn:hover {
    background: #c82333;
    transform: scale(1.05);
}

.no-favorites {
    text-align: center;
    padding: 4rem 1rem;
    color: #6c757d;
}

.no-favorites-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.6;
}

.no-favorites-text {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.no-favorites-desc {
    font-size: 0.9rem;
}

.add-favorite-btn {
    width: 100%;
    background: none;
    border: 2px dashed #e9ecef;
    border-radius: 12px;
    padding: 1.25rem;
    color: #6c757d;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 0.9rem;
    font-weight: 500;
}

.add-favorite-btn:hover {
    border-color: #20c997;
    color: #20c997;
    background: rgba(32, 201, 151, 0.05);
}

.max-favorites-notice {
    text-align: center;
    padding: 1.25rem;
    color: #6c757d;
    font-size: 0.9rem;
    background: #f8f9fa;
    border-radius: 12px;
    border: 1px dashed #e9ecef;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    border-radius: 16px;
    padding: 2rem;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.transfer-modal {
    max-width: 600px;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;
}

.modal-header h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #333;
}

.close-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: #6c757d;
    cursor: pointer;
    padding: 0;
    line-height: 1;
}

.close-btn:hover {
    color: #dc3545;
}

.add-friend-form,
.transfer-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.form-group label {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
}

.form-group input,
.form-group select {
    padding: 0.75rem;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
    outline: none;
    border-color: #20c997;
    box-shadow: 0 0 0 3px rgba(32, 201, 151, 0.1);
}

.form-group input.error {
    border-color: #dc3545;
    box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.error-message {
    color: #dc3545;
    font-size: 0.8rem;
    font-weight: 500;
}

.password-input {
    text-align: center;
    font-size: 1.2rem;
    letter-spacing: 0.5rem;
    font-family: monospace;
}

.password-dots {
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.password-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #e9ecef;
    transition: all 0.2s;
}

.password-dot.filled {
    background: #20c997;
    transform: scale(1.2);
}

.currency-selection {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.currency-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 2px solid #e9ecef;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
}

.currency-card:hover {
    border-color: #20c997;
    background: rgba(32, 201, 151, 0.05);
}

.currency-card.selected {
    border-color: #20c997;
    background: rgba(32, 201, 151, 0.1);
}

.currency-info {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.currency-flag {
    font-size: 1.5rem;
}

.currency-details {
    display: flex;
    flex-direction: column;
}

.currency-name {
    font-weight: 600;
    color: #333;
    font-size: 0.95rem;
}

.currency-code {
    font-size: 0.8rem;
    color: #6c757d;
}

.currency-balance {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
}

.balance-amount {
    font-weight: 700;
    color: #20c997;
    font-size: 1rem;
}

.balance-krw {
    font-size: 0.8rem;
    color: #6c757d;
}

.amount-input-container {
    position: relative;
    display: flex;
    align-items: center;
}

.amount-input {
    flex: 1;
    padding-right: 4rem;
}

.currency-symbol {
    position: absolute;
    right: 1rem;
    color: #6c757d;
    font-weight: 600;
    font-size: 0.9rem;
}

.balance-info {
    font-size: 0.85rem;
    color: #6c757d;
    margin-top: 0.25rem;
}

.transfer-summary {
    background: #f8f9fa;
    padding: 1.5rem;
    border-radius: 12px;
    border: 1px solid #e9ecef;
}

.summary-title {
    font-weight: 600;
    color: #333;
    margin-bottom: 1rem;
    font-size: 1rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid #e9ecef;
}

.summary-row:last-child {
    border-bottom: none;
}

.summary-row.total {
    font-weight: 700;
    color: #333;
    font-size: 1.05rem;
    margin-top: 0.5rem;
    padding-top: 1rem;
    border-top: 2px solid #e9ecef;
}

.free {
    color: #20c997;
    font-weight: 600;
}

.modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.cancel-btn,
.confirm-btn {
    flex: 1;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.cancel-btn {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    color: #6c757d;
}

.cancel-btn:hover {
    background: #e9ecef;
}

.confirm-btn {
    background: #20c997;
    border: none;
    color: white;
}

.confirm-btn:hover:not(:disabled) {
    background: #17a2b8;
}

.confirm-btn:disabled {
    background: #6c757d;
    cursor: not-allowed;
    opacity: 0.6;
}

@media (max-width: 768px) {
    .favorites-page {
        padding: 1rem;
    }
    
    .page-header {
        padding: 1rem 1.5rem;
    }
    
    .page-title {
        font-size: 1.5rem;
    }
    
    .favorite-accounts-card {
        padding: 1.5rem;
    }
    
    .modal-content {
        max-width: 95%;
        margin: 1rem;
    }
    
    .currency-card {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
    }
    
    .quick-actions {
        flex-direction: row;
        align-items: center;
        gap: 0.5rem;
    }
}
</style>
