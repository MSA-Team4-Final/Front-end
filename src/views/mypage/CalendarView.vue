<template>
  <div class="calendar-container">
    <h2 class="calendar-title">캘린더</h2>

    <a-calendar 
      :value="currentMonth"
      :date-cell-render="dateCellRender"  
      @select="onSelect"
      @panel-change="onPanelChange"
    />

    <div class="selected-date" v-if="selectedDate">
      <a-button  class="service-btn" @click="openAddModal">일정 추가</a-button>
    </div>

    <!-- 일정 추가 모달 -->
    <a-modal
      v-model:visible="isModalVisible"
      title="일정 추가"
      :footer="null"
    >
      <a-form layout="vertical">
        <a-form-item label="일정명">
          <a-input v-model:value="eventTitle" placeholder="일정을 입력하세요" />
        </a-form-item>
        <a-form-item label="상세내용">
          <a-textarea :rows="3" v-model:value="eventDesc" placeholder="상세내용을 입력하세요" />
        </a-form-item>
        <a-form-item label="시작 시간">
          <a-time-picker v-model="startTime" format="HH:mm" />
        </a-form-item>
        <a-form-item label="종료 시간">
          <a-time-picker v-model="endTime" format="HH:mm" />
        </a-form-item>
      </a-form>

      <div style="text-align: right; margin-top: 16px;">
        <button @click="isModalVisible = false" style="margin-right:8px">취소</button>
        <button type="button" @click="addEvent">저장</button>
      </div>
    </a-modal>

    <a-modal
      v-model:visible="isDetailModalVisible"
      title="일정 상세"
      :footer="null"
    >
      <p><strong>일정명:</strong> {{ selectedEvent?.title }}</p>
      <p><strong>상세내용:</strong> {{ selectedEvent?.description }}</p>
      <p><strong>시간:</strong> {{ selectedEvent?.startTime }} ~ {{ selectedEvent?.endTime }}</p>

      <div style="text-align: right; margin-top: 16px;">
        <button @click="isDetailModalVisible = false" style="margin-right:8px">닫기</button>
        <button type="button" @click="deleteEvent(selectedEvent)">삭제</button>
      </div>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, h, nextTick, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import axios from 'axios'

const selectedDate = ref(null)
const currentMonth = ref(dayjs())
const events =  reactive({})

const isModalVisible = ref(false)
const eventTitle = ref('')
const eventDesc = ref('')
const startTime = ref(null)
const endTime = ref(null)

const isDetailModalVisible = ref(false)
const selectedEvent = ref(null)

const onSelect = (date) => {
  selectedDate.value = date
}

// 모달 열기
const openAddModal = async () => {
  if (!selectedDate.value) return
  document.activeElement?.blur()

  eventTitle.value = ''
  eventDesc.value = ''
  startTime.value = '09:00'
  endTime.value = '10:00'

  isModalVisible.value = true
  await nextTick()
  document.querySelector('.ant-input')?.focus()
}

// 일정 추가
const addEvent = async () => {
  if (!eventTitle.value || !eventTitle.value.trim()) {
    alert('일정명을 입력하세요.')
    return
  }

  const dateKey = selectedDate.value.format('YYYY-MM-DD')
  const newEvent = {
    title: eventTitle.value,
    description: eventDesc.value,
    date: dateKey,
    startTime: startTime.value || '09:00',
    endTime: endTime.value || '10:00'
  }

  try {
    const res = await axios.post('/api/user/calendar', newEvent)
    const savedEvent = res.data

    if (!events[dateKey]) events[dateKey] = []
    events[dateKey].push(savedEvent)

    // 모달 닫기
    isModalVisible.value = false
    message.success('일정이 추가 되었습니다.')
  } catch (error) {
    console.error('일정 추가 실패:', error)
    alert('일정 추가에 실패했습니다.')
  }
}

const handleEventClick = (event) => {
  selectedEvent.value = event
  isDetailModalVisible.value = true
}

// 일정 삭제
const deleteEvent = async (event) => {
  if (!event.id) {
    alert("이 이벤트에는 삭제 가능한 ID가 없습니다.")
    return
  }

  try {
    await axios.delete(`/api/user/calendar/${event.id}`)

    // 로컬 상태에서 삭제
    const dateKey = Object.keys(events).find(key => events[key].includes(event))
    if (dateKey) {
      events[dateKey] = events[dateKey].filter(ev => ev.id !== event.id)
    }

    // 모달 닫기
    isDetailModalVisible.value = false
    message.success('일정이 삭제 되었습니다.')
  } catch (err) {
    console.error('삭제 실패:', err)
    alert('삭제에 실패했습니다.')
  }
}

// 일정 표시
const fetchMonthEvents = async (yearMonth) => {
  const start = dayjs(yearMonth).startOf('month').format('YYYY-MM-DD')
  const end = dayjs(yearMonth).endOf('month').format('YYYY-MM-DD')

  try {
    const res = await axios.get('/api/user/calendar/range', { params: { start, end } })

    const tempEvents = {}
    res.data.forEach(ev => {
      console.log(ev.date)
      const dateKey = dayjs(ev.date).format('YYYY-MM-DD')
      if (!tempEvents[dateKey]) tempEvents[dateKey] = []
      tempEvents[dateKey].push({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        startTime: ev.startTime,
        endTime: ev.endTime
      })
    })

     Object.keys(events).forEach(key => delete events[key])
    Object.assign(events, tempEvents)
    await nextTick()
  } catch (err) {
    console.error('월별 일정 조회 실패', err)
  }
}

// 달력 월 변경 시 호출
const onPanelChange = (date) => {
  const newMonth = dayjs(date)
  currentMonth.value = newMonth
  
  fetchMonthEvents(newMonth)
}

// 날짜 셀 이벤트 렌더
const dateCellRender = ({ current }) => {
  const dateKey = dayjs(current).format('YYYY-MM-DD')
  const dayEvents = events[dateKey] || []

  if (dayEvents.length > 0) {
    return h('div', { class: 'date-cell-events' },
      dayEvents.map(ev => 
        h('div', { 
          class: 'event-item',
          onClick: () => handleEventClick(ev)
        }, ev.title))
    )
  }
  return null
}

onMounted(() => {
  fetchMonthEvents(currentMonth.value)
})
</script>

<style>
.calendar-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.calendar-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
}

.selected-date {
  margin-top: 16px;
  font-size: 16px;
  color: #555;
}

.service-btn {
  height: 38px;
  padding: 0 14px;
  border-radius: 12px;
  font-size: 0.95rem;
  font-weight: 600;
  border: none;
  background: #e0f7f4;
  color: #009490;
  box-shadow: 0 2px 6px rgba(0,148,144,0.08);
  cursor: pointer;
  transition: background 0.2s, color 0.2s, transform 0.06s;
}
.service-btn:hover {
  background: #009490;
  color: #fff;
}
.service-btn:active {
  transform: translateY(1px);
}

.date-cell-events {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.event-item {
  background: #e0f7f4;
  color: #009490;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>