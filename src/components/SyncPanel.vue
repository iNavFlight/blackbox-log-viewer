<template>
  <div class="toolbar-panel log-sync-panel">
    <h4>Log sync</h4>
    <div class="flex items-center gap-0.5">
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-step-back"
        size="xs"
        title="Move log earlier"
        @click="$emit('sync-back')"
      />
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-align-start-vertical"
        size="xs"
        title="Start log here"
        @click="$emit('sync-here')"
      />
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-step-forward"
        size="xs"
        title="Move log later"
        @click="$emit('sync-forward')"
      />
      <UInput
        :model-value="appStore.videoOffsetDisplay"
        size="xs"
        class="w-16 font-mono"
        title="Enter a time offset"
        @change="$emit('offset-change', $event.target.value)"
      />
      <UButton
        variant="ghost"
        color="neutral"
        icon="i-lucide-align-center-vertical"
        size="xs"
        title="Smart Sync (Alt+M). A second one at least 10 s away also measures the drift"
        @click="$emit('smart-sync')"
      />
      <UInput
        :model-value="appStore.videoDriftDisplay"
        size="xs"
        class="w-24 font-mono"
        title="Drift: microseconds of log per second of video, from the different clocks of the FC and the camera"
        @change="$emit('drift-change', $event.target.value)"
      >
        <template #trailing>
          <span class="text-[10px] text-dimmed">µs/s</span>
        </template>
      </UInput>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from "../stores/app.js";

defineEmits(["sync-back", "sync-forward", "sync-here", "smart-sync", "offset-change", "drift-change"]);

const appStore = useAppStore();
</script>
