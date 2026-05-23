<template>
  <div class="player">
    <button class="player__play" :aria-label="playing ? 'Pause' : 'Play'" @click="toggle">
      <QIcon :name="playing ? 'pause' : 'play'" :size="18" />
    </button>

    <div class="player__main">
      <div ref="bar" class="player__track" @pointerdown="onScrub">
        <div class="player__fill" :style="{ width: `${progress}%` }" />
        <div class="player__knob" :style="{ left: `${progress}%` }" />
      </div>
      <div class="player__meta">
        <span class="player__time">{{ fmt(current) }}</span>
        <button class="player__rate" :title="`Playback speed ${rate}×`" @click="cycleRate">{{ rate }}×</button>
        <span class="player__time">{{ fmt(duration) }}</span>
      </div>
    </div>

    <audio
      ref="audio"
      :src="src"
      preload="metadata"
      @timeupdate="onTime"
      @loadedmetadata="onLoaded"
      @ended="onEnded"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import QIcon from './QIcon.vue'

const props = defineProps<{ src: string }>()

const audio = ref<HTMLAudioElement | null>(null)
const bar = ref<HTMLElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref(0)

const RATES = [1, 1.25, 1.5, 2]
const rateIndex = ref(0)
const rate = computed(() => RATES[rateIndex.value])
const progress = computed(() => (duration.value > 0 && isFinite(duration.value) ? (current.value / duration.value) * 100 : 0))

function toggle(): void {
  const el = audio.value
  if (!el) return
  if (el.paused) {
    void el.play()
    playing.value = true
  } else {
    el.pause()
    playing.value = false
  }
}

function onTime(): void {
  current.value = audio.value?.currentTime ?? 0
}
function onLoaded(): void {
  duration.value = audio.value?.duration ?? 0
}
function onEnded(): void {
  playing.value = false
  current.value = 0
}

function onScrub(event: PointerEvent): void {
  const track = bar.value
  const el = audio.value
  if (!track || !el || !duration.value || !isFinite(duration.value)) return
  const rect = track.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width))
  el.currentTime = ratio * duration.value
  current.value = el.currentTime
}

function cycleRate(): void {
  rateIndex.value = (rateIndex.value + 1) % RATES.length
  if (audio.value) audio.value.playbackRate = rate.value
}

function fmt(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

// Reset transport when the source changes (e.g. regenerated podcast).
watch(
  () => props.src,
  () => {
    playing.value = false
    current.value = 0
    duration.value = 0
  },
)
</script>

<style scoped>
.player {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.7rem;
  background: var(--paper-sunken);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
}
.player__play {
  flex: none;
  width: 40px;
  height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 50%;
  background: var(--accent);
  color: var(--accent-ink);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), transform var(--dur-fast) var(--ease-out);
}
.player__play:hover {
  background: var(--accent-hover);
}
.player__play:active {
  transform: scale(0.95);
}
.player__main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.player__track {
  position: relative;
  height: 6px;
  border-radius: var(--radius-full);
  background: var(--rule-strong);
  cursor: pointer;
}
.player__fill {
  position: absolute;
  inset: 0 auto 0 0;
  height: 100%;
  border-radius: var(--radius-full);
  background: var(--accent);
}
.player__knob {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px var(--paper-sunken);
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.player__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.player__time {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
}
.player__rate {
  border: 1px solid var(--rule);
  background: var(--paper-raised);
  color: var(--ink-muted);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  border-radius: var(--radius-full);
  padding: 0.05rem 0.45rem;
  cursor: pointer;
}
.player__rate:hover {
  color: var(--accent);
  border-color: var(--accent);
}
</style>
