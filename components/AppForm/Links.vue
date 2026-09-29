<template>
  <base-form-section title="Links" description="Add some links here">
    <draggable
      :list="modelValue"
      :item-key="getItemKey"
      class="list-group"
      ghost-class="ghost"
    >
      <template #item="{ element: link }">
        <div class="relative mb-6 group">
          <span aria-hidden="true" class="absolute top-2 -left-8">
            <icon
              name="radix-icons:drag-handle-dots-2"
              class="h-6 w-6 text-slate-500 drag-handle"
            />
          </span>
          <button
            type="button"
            :aria-label="`Remove ${link.l || 'untitled'} link`"
            @click="removeLink(link)"
            class="flex items-center justify-center h-8 w-8 rounded-full bg-slate-200 text-slate-700 absolute -right-3 -top-3 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-800"
          >
            <icon name="fluent:dismiss-24-regular" class="h-4 w-4" />
          </button>
          <div class="shadow sm:overflow-hidden sm:rounded-md">
            <div class="space-y-6 bg-white px-4 py-5 sm:p-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Section (optional; repeat to group links)
                    <input
                      type="text"
                      v-model="link.g"
                      maxlength="80"
                      placeholder="Free tools"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </label>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Label
                    <input
                      type="text"
                      v-model="link.l"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </label>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Description (optional)
                    <textarea
                      rows="2"
                      v-model="link.s"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    ></textarea>
                  </label>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700">
                    Link image URL (optional, HTTPS)
                    <input
                      type="url"
                      v-model="link.image"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </label>
                </div>
                <div class="col-span-2">
                  <label class="block text-sm font-medium text-gray-700">
                    URL
                    <input
                      type="url"
                      v-model="link.u"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </label>
                </div>
              </div>
              <p
                class="mt-2 text-xs text-center text-slate-400"
                v-if="!link.l || !link.u"
              >
                Link shown in preview once label and url are added
              </p>
            </div>
          </div>
        </div>
      </template>
    </draggable>

    <button
      type="button"
      aria-label="Add link"
      @click="appendLink"
      class="mt-8 border-2 text-slate-500 border-slate-300 rounded-lg block w-full py-2"
    >
      <icon name="fluent:add-circle-24-regular" class="h-6 w-6" />
    </button>
  </base-form-section>
</template>
<script setup>
import draggable from "vuedraggable";
const emit = defineEmits(["update:modelValue"]);
const props = defineProps({
  modelValue: Array,
});
const itemKeys = new WeakMap();
let nextItemKey = 0;
const getItemKey = (link) => {
  if (!itemKeys.has(link)) itemKeys.set(link, ++nextItemKey);
  return itemKeys.get(link);
};
const appendLink = () => {
  props.modelValue.push({
    l: "",
    g: "",
    s: "",
    image: "",
    u: "",
  });
  emit("update:modelValue", props.modelValue);
};

const removeLink = (link) => {
  const index = props.modelValue.indexOf(link);
  props.modelValue.splice(index, 1);
  emit("update:modelValue", props.modelValue);
};
</script>
<style scoped>
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.list-group {
  min-height: 20px;
}
.list-group-item {
  cursor: move;
}
.list-group-item i {
  cursor: pointer;
}
</style>
