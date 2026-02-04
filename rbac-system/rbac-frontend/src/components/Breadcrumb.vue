<template>
  <a-breadcrumb>
    <a-breadcrumb-item>
      <router-link to="/"><icon-home /></router-link>
    </a-breadcrumb-item>
    <template v-for="(item, index) in breadcrumbs" :key="index">
      <a-breadcrumb-item>
        {{ item.title }}
      </a-breadcrumb-item>
    </template>
  </a-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(r => r.meta?.title)
  return matched.map(r => ({
    title: r.meta?.title as string,
    path: r.path,
  }))
})
</script>
