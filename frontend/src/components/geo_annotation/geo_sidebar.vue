<template>
    <div :style="`
        width: 350px; 
        border-right: 1px solid #e0e0e0; 
        max-height: calc(100vh - ${toolbar_height});
        position: sticky;
        left: 0;
        top: ${toolbar_height}
    `">
        <v-data-table
            hide-default-footer
            :style="`width: 350px; max-height: 100%; overflow-y: scroll`"
            :headers="headers"
            :items="instance_list"
            fixed-header
            disable-pagination
        >
            <template v-slot:body="{ items }">
                <tbody v-if="items.length > 0 && !loading">
                  <tr
                    v-for="item in items"
                    :key="item.id"
                    @mouseover="on_hover_item(item)"
                    @mouseleave="on_stop_hover_item"
                  >
                    <td v-if="$store.state.user.settings.show_ids == true" class="centered-table-items">
                        {{ item.id || 'new' }}
                    </td>
                    <td class="centered-table-items">
                        <v-icon 
                            v-if="item.type === 'geo_circle'"
                            :color="item.label_file.colour.hex"
                        >
                            mdi-checkbox-blank-circle-outline
                        </v-icon>
                        <v-icon 
                            v-if="item.type === 'geo_point'"
                            :color="item.label_file.colour.hex"
                        >
                            mdi-circle-slice-8
                        </v-icon>
                        <v-icon 
                            v-if="item.type === 'geo_box'"
                            :color="item.label_file.colour.hex"
                        >
                            mdi-checkbox-blank
                        </v-icon>
                        <v-icon 
                            v-if="item.type === 'geo_polygon'"
                            :color="item.label_file.colour.hex"
                        >
                            mdi-vector-polygon
                        </v-icon>
                        <v-icon 
                            v-if="item.type === 'geo_polyline'"
                            :color="item.label_file.colour.hex"
                        >
                            mdi-minus
                        </v-icon>
                    </td>
                    <td class="centered-table-items">
                        {{ item.label_file.label.name }}
                    </td>
                    <td class="centered-table-items">
                        <v-layout justify-center>
                            <button_with_menu
                                    tooltip_message="Change Label Template"
                                    icon="mdi-format-paint"
                                    color="primary"
                                    :close_by_button="true"
                                >
                                    <template slot="content">
                                        <label_select_only
                                        :label_file_list_prop="label_list"
                                        :select_this_id_at_load="item.label_file_id"
                                        @label_file="$emit('change_instance_label', { label: $event, instance: item })"
                                        />
                                    </template>
                            </button_with_menu>
                            <tooltip_button
                                color="primary"
                                icon="mdi-delete"
                                tooltip_message="Delete instance"
                                @click="$emit('delete_instance', item)"
                                :icon_style="true"
                                :bottom="true"
                            />
                        </v-layout>
                    </td>
                  </tr>
                </tbody>
                <tbody v-else>
                    <tr>
                        <td :colspan="headers.length" style="text-align: center">
                            {{ loading ? "Loading..." : "No instances have been created yet" }}
                        </td>
                    </tr>
                </tbody>
            </template>
        </v-data-table>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import instance_detail_list_view from "../annotation/instance_detail_list_view.vue";
import button_with_menu from '../regular/button_with_menu.vue';
import label_select_only from '../label/label_select_only.vue'
export default Vue.extend({
    name: "geo_sidepanel",
    components: {
        instance_detail_list_view,
        button_with_menu,
        label_select_only
    },
    props: {
        instance_list: {
            type: Array,
            default: []
        },
        label_list: {
            type: Array,
            default: []
        },
        toolbar_height: {
            type: String,
            default: '100px'
        },
        loading: {
            type: Boolean,
            required: true
        }
    },
    computed: {
        headers: function() {
            if (this.$store.state.user.current.is_super_admin) {
                return [
                {
                    text: 'Id',
                    align: 'center',
                    sortable: false,
                    value: 'id'
                },
                {
                    text: 'Type',
                    align: 'center',
                    sortable: false,
                    value: 'type'
                },
                { 
                    text: 'Name', 
                    value: 'label_file.label.name',
                    sortable: false,
                    align: 'center'
                },
                { 
                    text: 'Action', 
                    value: 'action',
                    sortable: false,
                    align: 'center'
                }
            ]
            }
        
            return [
                {
                    text: 'Type',
                    align: 'center',
                    sortable: false,
                    value: 'type'
                },
                { 
                    text: 'Name', 
                    value: 'label_file.label.name',
                    sortable: false,
                    align: 'center'
                },
                { 
                    text: 'Action', 
                    value: 'action',
                    sortable: false,
                    align: 'center'
                }
            ]
        }
    },
    methods: {
        on_hover_item: function(item) {
            this.$emit("on_instance_hover", item.get_instance_data().id)
        },
        on_stop_hover_item: function() {
            this.$emit("on_instance_stop_hover")
        }
    }
})
</script>

<style scoped>
.centered-table-items {
    vertical-align: middle; 
    text-align: center;
}
</style> 
