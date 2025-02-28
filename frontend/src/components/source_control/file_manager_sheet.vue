<template>

  <div >
    <v-bottom-sheet :retain-focus="false"
                    hide-overlay
                    class="media-core-container"
                    no-click-animation
                    style="position: fixed"
                    :fullscreen="full_screen"
                    v-if="!error_permissions.data"
                    :persistent="persistent_bottom_sheet"
                    v-model="media_sheet">
      <v-card class="pa-0 d-flex flex-column" >

        <v-card-text class="pa-0 d-flex flex-column">
          <v-tabs v-model="tab"
                  align-with-title
                  color="primary">
            <v-tab
              v-for="item in items"
              :data-cy="`tab__${item.text}`"
              :key="item.text"
            >
              <v-icon left>{{item.icon}}</v-icon>
              {{ item.text }}
            </v-tab>

            <v-spacer> </v-spacer>

            <tooltip_button
              tooltip_message="Minimize"
              @click="media_sheet = !media_sheet"
              icon="mdi-window-minimize"
              :icon_style="true"
              color="primary"
              :bottom="true"
              datacy="minimize-file-explorer-button"
            >
            </tooltip_button>

            <tooltip_button
              v-if="full_screen"
              tooltip_message="Restore Down"
              @click="minimize_sheet"
              icon="mdi-window-restore"
              :icon_style="true"
              color="primary"
              :bottom="true"
              datacy="restore-down-file-explorer-button"
            >
            </tooltip_button>

            <tooltip_button
              v-if="!full_screen"
              tooltip_message="Maximize"
              @click="full_screen_sheet"
              icon="mdi-window-maximize"
              :icon_style="true"
              color="primary"
              :bottom="true"
              datacy="fullscreen-file-explorer-button"
            >
            </tooltip_button>

            <tooltip_button
              tooltip_message="Close"
              @click="media_sheet = !media_sheet"
              icon="mdi-close"
              :icon_style="true"
              color="primary"
              :bottom="true"
              datacy="close-file-explorer-button"
            >
            </tooltip_button>



            <v-tabs-items v-model="tab" class="d-flex flex-column">
              <v-tab-item>
                <v_media_core
                              v-if="show_sheet"
                              :project_string_id="project_string_id"
                              file_view_mode="annotation"
                              :task="task"
                              :full_screen="full_screen"
                              :view_only_mode="view_only"
                              :file_id_prop="file_id_prop"
                              :job_id="job_id"
                              :visible="media_sheet"
                              @height="media_core_height = $event"
                              @permissions_error="set_permissions_error"
                              @file_changed="change_file"
                              ref="media_core"
                >
                </v_media_core>
              </v-tab-item>
              <v-tab-item>
                <dataset_explorer
                                  v-if="show_sheet"
                                  :project_string_id="project_string_id"
                                  :full_screen="full_screen"
                                  :directory="$store.state.project.current_directory"
                                  @view_detail="change_file_and_close"
                                  ref="dataset_explorer">
                </dataset_explorer>
              </v-tab-item>
            </v-tabs-items>
          </v-tabs>
        </v-card-text>

      </v-card>
    </v-bottom-sheet>
    <!-- Open Bottom Sheet -->
    <v-tooltip v-if="media_sheet == false && !task" v-show="!initializing"
               bottom>
      Open File Explorer
      <template v-slot:activator="{ on }">
        <v-btn
          style="position: fixed; bottom: 25px; right: 25px"
          color="primary"
          data-cy="file_explorer_button"
          @click="media_sheet = !media_sheet"
          fab
          right
          absolute
          v-on="on"
        >
          <v-icon> mdi-folder-open</v-icon>
        </v-btn>
      </template>
    </v-tooltip>
  </div>
</template>

<script>
  import Vue from "vue";
  import dataset_explorer from "./dataset_explorer";
  export default Vue.extend({
    name: "file_manager_sheet",
    props: [
      'project_string_id',
      'task',
      'view_only',
      'file_id_prop',
      'job_id',
      'show_sheet',
      'show_explorer_full_screen',
      'enabled_edit_schema',
      'initializing',

    ],
    components:{
      dataset_explorer
    },
    mounted() {
      if (this.$props.show_explorer_full_screen) {
        this.tab = 1;
      }
    },
    data: function () {
      return {
        media_sheet: true,
        items: [
          {
            text: 'File Management',
            icon: 'mdi-file'
          },
          {
            text: 'Dataset Explorer',
            icon: 'mdi-folder'
          }
        ],
        persistent_bottom_sheet: true,
        full_screen: false,
        tab: 0,
        media_core_height: 0,
        error_permissions: {},
      }
    },
    watch:{
      show_explorer_full_screen: function (){
        if (this.$props.show_explorer_full_screen == true) {
          this.tab = 1
          this.full_screen_sheet()
          this.media_sheet = true
        }
      },
      tab: function(newval){
        if(newval === 1){
          this.full_screen_sheet();
        }
        if(newval === 0){
          this.minimize_sheet();
        }
      }
    },
    methods: {
      display_file_manager_sheet: function () {
        this.media_sheet = true;
      },
      hide_file_manager_sheet: function () {
        this.media_sheet = false;
      },
      get_media: function (fetch_single_file = true, file_id) {
        if(!this.$refs.media_core){
          return
        }
        return this.$refs.media_core.get_media(fetch_single_file, file_id);
      },
      request_change_file: function (direction, file) {
        if(!this.$refs.media_core){
          return
        }
        return this.$refs.media_core.change_file(direction, file);

      },
      set_file_list: function (file_list) {
        if(!this.$refs.media_core){
          return
        }
        return this.$refs.media_core.set_file_list(file_list);
      },
      full_screen_sheet: function () {
        this.full_screen = true;
      },
      minimize_sheet: function(){
        this.full_screen = false;
      },
      set_permissions_error: function (new_error) {
        this.error_permissions = new_error;
      },
      change_file_and_close: function(file, model_runs, color_list){
        this.change_file(file, model_runs, color_list);
        this.hide_file_manager_sheet();
      },
      change_file: function (file, model_runs, color_list) {
        this.minimize_sheet()
        this.$emit('change_file', file, model_runs, color_list)
      }
    }

  })
</script>

<style scoped>

</style>
