<template>
  <div v-if="!logStore.hasLog" class="welcome-page">
    <!-- Hero -->
    <div class="hero">
      <img src="/images/inav_logo_wide_on_light.svg" alt="INAV" class="hero-logo hero-logo-light" />
      <img src="/images/inav_logo_wide.svg" alt="INAV" class="hero-logo hero-logo-dark" />
      <p class="hero-subtitle">Blackbox Explorer</p>
      <p class="hero-tagline">Analyze flight logs recorded by INAV's blackbox</p>
      <LogFileInput size="lg" label="Open log file / video" @files-selected="$emit('files-selected', $event)" />
    </div>

    <!-- Info grid -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card-header">
          <UIcon name="i-lucide-book-open" class="size-4 text-primary-500" />
          <h3>Getting Started</h3>
        </div>
        <p>
          Blackbox is built into
          <a href="https://github.com/iNavFlight/inav/releases" target="_blank" rel="noopener noreferrer">INAV</a>
          and logs to an SD card or to the onboard flash.
        </p>
        <div class="info-links">
          <a href="https://github.com/iNavFlight/inav/blob/master/docs/Blackbox.md" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-file-text" class="size-3.5" /> Recording docs
          </a>
          <a href="https://github.com/iNavFlight/inav-configurator/releases" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-download" class="size-3.5" /> INAV Configurator
          </a>
          <a href="https://github.com/iNavFlight/blackbox-log-viewer/issues" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-bug" class="size-3.5" /> Report a bug
          </a>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-header">
          <UIcon name="i-lucide-sliders-horizontal" class="size-4 text-primary-500" />
          <h3>Tuning Resources</h3>
        </div>
        <p>Use Blackbox insights to tune PIDs, filters and navigation, on multirotors and planes.</p>
        <div class="info-links">
          <a href="https://github.com/iNavFlight/inav/blob/master/docs/PID%20tuning.md" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-file-text" class="size-3.5" /> PID tuning
          </a>
          <a href="https://github.com/iNavFlight/inav/blob/master/docs/INAV%20PID%20Controller.md" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-file-text" class="size-3.5" /> INAV PID controller
          </a>
          <a href="https://github.com/iNavFlight/inav/blob/master/docs/Autotune%20-%20fixedwing.md" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-plane" class="size-3.5" /> Fixed wing autotune
          </a>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-header">
          <UIcon name="i-lucide-wrench" class="size-4 text-primary-500" />
          <h3>Tools</h3>
        </div>
        <p>Convert and export your logs for further analysis.</p>
        <div class="info-links">
          <a href="https://github.com/iNavFlight/blackbox-tools/" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-terminal" class="size-3.5" /> blackbox_decode: CSV, GPX
          </a>
          <a href="https://github.com/iNavFlight/blackbox-tools/" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-film" class="size-3.5" /> blackbox_render: PNG frames
          </a>
        </div>
      </div>

      <div class="info-card">
        <div class="info-card-header">
          <UIcon name="i-lucide-info" class="size-4 text-primary-500" />
          <h3>Links</h3>
        </div>
        <p>INAV documentation, and the explorer's own source code.</p>
        <div class="info-links">
          <a href="https://github.com/iNavFlight/inav/wiki" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-book" class="size-3.5" /> INAV wiki
          </a>
          <a href="https://github.com/iNavFlight/blackbox-log-viewer" target="_blank" rel="noopener noreferrer">
            <UIcon name="i-lucide-github" class="size-3.5" /> Source on GitHub
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useLogStore } from "../stores/log.js";
import LogFileInput from "./LogFileInput.vue";

defineEmits(["files-selected"]);
const logStore = useLogStore();
</script>

<style scoped>
.welcome-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 2rem;
  padding: 2rem 1.5rem 6vh;
}

/* Hero section */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 0.25rem;
}

.hero-logo {
  height: 3.5rem;
  width: auto;
  margin-bottom: 0.5rem;
}

.hero-logo-dark,
:root.dark .hero-logo-light {
  display: none;
}

:root.dark .hero-logo-dark {
  display: block;
}

.hero-subtitle {
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--color-primary-500);
  margin: 0;
}

.hero-tagline {
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0 0 0.75rem;
}

/* Info grid */
.info-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  width: 100%;
  max-width: 56rem;
}

@media (max-width: 900px) {
  .info-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 500px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* Info cards */
.info-card {
  border: 1px solid var(--border-color, #ddd);
  border-radius: 0.5rem;
  padding: 0.75rem;
  background: var(--surface-0);
  /* header, text and links line up across the cards */
  display: grid;
  grid-row: span 3;
  grid-template-rows: subgrid;
  row-gap: 0.4rem;
  font-size: 0.75rem;
  color: var(--text-secondary);
  transition: border-color 0.2s;
}

.info-card:hover {
  border-color: var(--color-primary-500);
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.info-card-header h3 {
  font-size: 0.8rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

.info-card p {
  margin: 0;
  line-height: 1.4;
}

/* Link list */
.info-links {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding-top: 0.25rem;
  border-top: 1px solid var(--border-color, #eee);
}

.info-links a {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.75rem;
  color: var(--color-primary-700);
  text-decoration: none;
  padding: 0.2rem 0.35rem;
  border-radius: 0.25rem;
  transition: background-color 0.15s, color 0.15s;
}

.info-links a:hover {
  background-color: var(--color-primary-50);
  color: var(--color-primary-800);
}

:root.dark .info-links a {
  color: var(--color-primary-400);
}

:root.dark .info-links a:hover {
  background-color: rgba(55, 168, 219, 0.12);
  color: var(--color-primary-300);
}
</style>
