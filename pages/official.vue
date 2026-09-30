<template>
  <div />
</template>
<script setup>
definePageMeta({
  middleware: () => navigateTo('/', { redirectCode: 301, replace: true }),
});
</script>
