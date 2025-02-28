<template>

  <v-bottom-sheet fullscreen v-if="is_open" v-model="is_open"

                  width="1700px" id="task-input-list-dialog"

                  persistent>
    <v-layout style="position: relative; z-index: 999999">
      <v-btn class="" @click="close" icon x-large style="position: absolute; top: 0; right: -10px;">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-layout>

    <v-stepper v-model="el" :non-linear="true" style="height: 100%;" @change="on_change_step">

      <v-stepper-header class="ma-0 pl-8 pr-8">
        <v-stepper-step
          editable
          :complete="el > 1"
          step="1"
        >
          Start
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step
          editable
          :complete="el > 2"
          step="2"
        >
          Dataset Selection
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step
          editable
          :complete="el > 3"
          step="3">
          Prepare Prelabeled Data
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step
          editable
          :complete="el > 4"
          step="4">
          Match File Schema
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="el > 5" step="5" editable>
          Match Instance Schema
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="el > 6" step="6" editable>
          Confirm Upload
        </v-stepper-step>
      </v-stepper-header>

      <!-- Idea of this globally updating
        especially as large inner steps like mapping
        complete progress-->
      <v-progress-linear
        color="secondary"
        striped
        :value="global_progress"
        height="12"
      >
      </v-progress-linear>

      <status :show_detail="false"> </status>

      <v-stepper-items style="height: 100%">
        <v-stepper-content step="1" style="height: 100%">
          <div class="d-flex justify-center flex-column">
            <h1 class="text-center">
              <v-icon x-large color="primary">mdi-upload</v-icon>
              Welcome to the Diffgram Upload Wizard!
            </h1>

            <h3 class="text-center mb-12">Do you want to upload new data or update existing files?</h3>

            <div class="d-flex justify-space-around ">
               <v-btn
                color="primary"
                x-large
                data-cy="upload_new_data"
                @click="set_upload_mode('new')"
              >
                <v-icon left> mdi-file-plus</v-icon>
                New
              </v-btn>

              <v-btn
                x-large
                data-cy="upload_existing_data"
                color="primary lighten-2"
                @click="set_upload_mode('update')"
              >
                <v-icon left> mdi-update</v-icon>
                Update
              </v-btn>
            </div>

           <div class="d-flex flex-column mt-12 justify-center align-center">

            <h4 class="mb-4 primary--text lighten-2">
                Want an example to test out?
            </h4>

            <v-btn
                text
                small
                href="https://storage.googleapis.com/diffgram-002/public/diffgramDataUploadExample.zip">
                <v-icon left> mdi-download</v-icon>
            Download Sample
            </v-btn>

            </div>

            <div class="d-flex flex-column mt-12 justify-center align-center">
              <h4 class="mb-4 primary--text lighten-2">
                <v-icon>mdi-database-check-outline</v-icon>
                Have a Diffgram export file?
              </h4>
              <v-btn
                data-cy="from_diffgram_export"
                text
                small
                @click="set_upload_mode('from_diffgram_export')"
              >
                Re-Import a Diffgram Export
              </v-btn>
            </div>
          </div>
        </v-stepper-content>
        <v-stepper-content step="2" style="height: 100%">
          <div class="d-flex justify-center flex-column align-center ma-auto">
            <h1 class="text-center">
              <v-icon x-large color="primary">mdi-folder</v-icon>
              Select Dataset:
            </h1>
            <h3 class="text-center">Please select the dataset where you want to upload your files, or create a new
              one.</h3>
            <br>
            <br>
            <div class="d-flex justify-space-around">
              <v-container fluid class="d-flex align-center justify-center">

                <directory_selector :set_from_id="initial_dataset ? initial_dataset.directory_id : undefined"
                                  :show_text_buttons="false"
                                  :project_string_id="project_string_id"
                                  @change_directory="on_change_directory"
                                  :show_new="true"
                                  :show_update="true"
                >
                </directory_selector>

              </v-container>

            </div>
            <div class="d-flex">
              <v-btn
                color="primary"
                x-large
                data-cy="set_dataset_button"
                @click="check_errors_and_go_to_step(3)"
              >
                Continue
              </v-btn>
            </div>
          </div>
        </v-stepper-content>
        <v-stepper-content step="3" style="height: 100%">

          <new_or_update_upload_screen
            @file_update_error="file_update_error = $event"
            @file_list_updated="file_list_updated"
            @update_progress_percentage="update_progress_percentage"
            @complete_question="set_completed_questions"
            @error_upload_connections="error_upload_connections"
            @error_update_files="error_update_files = $event"
            @upload_in_progress="show_upload_progress_screen"
            @change_step_no_annotations="el = 6"
            @change_step_annotations="load_annotations_file"
            @change_step_export="load_export_file"
            @progress_updated="update_progress_values"
            @update_is_actively_sending="update_is_actively_sending"
            @reset_total_files_size="reset_total_files_size"
            @current_directory="set_current_directory"
            @file_added="file_added"
            @file_removed="file_removed"
            @declare_success="on_success_upload"
            ref="new_or_update_upload_screen"
            :initial_dataset="initial_dataset"
            :current_directory="current_directory"
            :upload_mode="upload_mode"
            :batch="batch"
            :error_file_uploads="error_file_uploads"
            :project_string_id="project_string_id">

          </new_or_update_upload_screen>

        </v-stepper-content>

        <v-stepper-content step="4">
          <file_schema_mapper
            v-if="['new', 'update'].includes(upload_mode)"
            :project_string_id="project_string_id"
            :pre_label_key_list="pre_label_key_list"
            :upload_mode="upload_mode"
            :included_instance_types="included_instance_types"
            :current_directory="current_directory"
            :supported_video_files="supported_video_files"
            :diffgram_schema_mapping="diffgram_schema_mapping"
            :file_list_to_upload="file_list_to_upload"
            :pre_labeled_data="pre_labeled_data"
            @change_step_wizard="check_errors_and_go_to_step(5)"
            @complete_question="set_completed_questions"
            @set_prelabeled_data="set_prelabeled_data"
            @set_included_instance_types="included_instance_types = $event"
            :previously_completed_questions="5"
          ></file_schema_mapper>
          <diffgram_export_validator
            v-if="['from_diffgram_export'].includes(upload_mode)"
            :project_string_id="project_string_id"
            :diffgram_export_ingestor="diffgram_export_ingestor"
            :upload_mode="upload_mode"
            @go_to_wizard_step="check_errors_and_go_to_step($event)"
            ref="diffgram_export_validator"
          ></diffgram_export_validator>
        </v-stepper-content>

        <v-stepper-content step="5">
          <instance_schema_mapper
            :project_string_id="project_string_id"
            :pre_label_key_list="pre_label_key_list"
            :upload_mode="upload_mode"
            :included_instance_types="included_instance_types"
            :supported_video_files="supported_video_files"
            :diffgram_schema_mapping="diffgram_schema_mapping"
            :file_list_to_upload="file_list_to_upload"
            :pre_labeled_data="pre_labeled_data"
            :pre_labels_file_type="pre_labels_file_type"
            @change_step_wizard="check_errors_and_go_to_step(6)"
            :previously_completed_questions="11"
            @set_included_instance_types="included_instance_types = $event"
          ></instance_schema_mapper>
        </v-stepper-content>

        <v-stepper-content step="6">
          <upload_summary
            style="height: 100%"
            v-if="!upload_in_progress && file_list_to_upload && el=== '6'"
            :file_list="file_list_to_upload.filter(f => f.data_type === 'Raw Media')"
            :upload_mode="upload_mode"
            :diffgram_export_ingestor="diffgram_export_ingestor"
            :project_string_id="project_string_id"
            :total_instance_count="pre_labeled_data ? pre_labeled_data.length : null"
            :pre_labeled_data="pre_labeled_data"
            :current_directory="current_directory"
            :diffgram_schema_mapping="diffgram_schema_mapping"
            @upload_raw_media="upload_raw_media"
            @complete_question="set_completed_questions"
            @created_batch="set_batch"
          ></upload_summary>
          <v_error_multiple :error="file_update_error"></v_error_multiple>

          <upload_progress
            v-if="upload_in_progress"
            :total_bytes="dropzone_total_file_size"
            :uploaded_bytes="dropzone_uploaded_file_size"
            :is_actively_sending="is_actively_sending"
            :currently_uploading="currently_uploading_bytes"
            :progress_percentage="progress_percentage"
            :error="error_update_files || connection_upload_error"
            :declare_success="declare_success"
            @close_wizard="close"
          >

          </upload_progress>

        </v-stepper-content>

      </v-stepper-items>

    </v-stepper>
  </v-bottom-sheet>
</template>

<script lang="ts">
  import DiffgramExportFileIngestor from './DiffgramExportFileIngestor';
  import input_view from './input_view'
  import new_or_update_upload_screen from './new_or_update_upload_screen'
  import file_schema_mapper from './file_schema_mapper'
  import instance_schema_mapper from './instance_schema_mapper'
  import diffgram_export_validator from './diffgram_export_validator'
  import upload_summary from './upload_summary'
  import upload_progress from './upload_progress'
  import axios from '../../services/customInstance';
  import Vue from "vue";
  import status from '../status'

  function get_initial_state() {
    const initial_state = {
      csv_separator: ',',
      uploaded_bytes: null,
      upload_mode: 'new',
      completed_questions: 0,
      completed_questions_dict: {},
      total_questions: 18,
      progress_percentage: null,
      with_pre_labels: null,
      is_actively_sending: true,

      error_update_files: undefined,
      connection_upload_error: undefined,
      batch: null,
      file_update_error: undefined,
      error_file_uploads: null,
      total_bytes: null,
      percent_uploaded: null,
      current_directory: null,
      supported_video_files: ['video/mp4', 'video/x-msvideo', 'video/quicktime', 'video/x-m4v'],
      supported_image_files: ['image/jpg', 'image/jpeg', 'image/png'],

      declare_success: false,

      diffgram_schema_mapping: {
        instance_type: null,
        file_id: null,
        name: null,
        file_name: null,
        frame_number: null,
        number: null,
        model_id: null,
        model_run_id: null,
        file_metadata: null,
        box: {
          x_min: null,
          x_max: null,
          y_min: null,
          y_max: null,
        },
        point: {
          x: null,
          y: null,
        },
        polygon: {
          points: null,
          points_y: null,
          points_x: null,
        },
        cuboid: {
          front_face_top_left_x: null,
          front_face_top_left_y: null,
          front_face_top_right_x: null,
          front_face_top_right_y: null,
          front_face_bottom_left_x: null,
          front_face_bottom_left_y: null,
          front_face_bottom_right_x: null,
          front_face_bottom_right_y: null,

          rear_face_top_left_x: null,
          rear_face_top_left_y: null,
          rear_face_top_right_x: null,
          rear_face_top_right_y: null,
          rear_face_bottom_left_x: null,
          rear_face_bottom_left_y: null,
          rear_face_bottom_right_x: null,
          rear_face_bottom_right_y: null,

        },
        ellipse: {
          center_x: null,
          center_y: null,
          width: null,
          height: null,
          angle: null,
        },
        line: {
          x1: null,
          y1: null,
          x2: null,
          y2: null,
        },
      },
      included_instance_types: {
        box: false,
        polygon: false,
        cuboid: false,
        ellipse: false,
        point: false,
        line: false,
      },
      is_open: false,
      el: 1,
      dropzone_total_file_size: 0,
      currently_uploading_bytes: 0,
      upload_in_progress: false,
      diffgram_export_ingestor: null,
      valid_labels: false,
      pre_labeled_data: null,
      file_list_to_upload: [],
      per_file_progress: {},

      pre_labels_file_list: [],
      pre_label_key_list: [],

      pre_labels_file_type: null,

    };
    return initial_state;
  }

  export default Vue.extend({
      name: 'upload_wizard_sheet',
      components: {
        input_view,
        upload_summary,
        file_schema_mapper,
        instance_schema_mapper,
        diffgram_export_validator,
        new_or_update_upload_screen,
        upload_progress,
        status
      },
      props: {
        'project_string_id': {
          default: null
        },
        'initial_dataset': {
          default: undefined
        }

      },

      data() {
        return get_initial_state();
      },
      computed: {
        dropzone_uploaded_file_size: function(){
          let result = 0;
          for(const file_key of Object.keys(this.per_file_progress)){
            result += this.per_file_progress[file_key];
          }
          return result

        },
        global_progress: function () {
          return 100 * (parseFloat(this.completed_questions) / this.total_questions);

        },
        selected_polygon_key_has_nested_valued: function () {
          if (!this.diffgram_schema_mapping.polygon.points) {
            return false
          }
          for (const elm in this.pre_labeled_data) {
            const pointsValue = elm[this.diffgram_schema_mapping.polygon.points];
            if (typeof pointsValue === 'object' && pointsValue !== null) {
              return true
            } else {
              return false;
            }
          }
          return false
        },
        instance_type_schema_is_set: function () {
          return this.diffgram_schema_mapping.instance_type != null;
        },
        file_name_schema_is_set: function () {
          if (this.upload_mode === 'new') {
            return this.diffgram_schema_mapping.file_name != null;
          } else {
            return this.diffgram_schema_mapping.file_id != null;
          }

        },
        dropzoneOptions: function () {

          // CAUTION despite being a computed property any values that CHANGE
          // after component is created don't seem to get actually reflected sometimes...
          // The drop zone options things doesn't update well from vuex, depsite being a computed prop
          // I think the actual vue js dropzone thing may be updating properly though
          // (Context of moving to using drop_zone_sending_event() for thing from vuex)
          const $vm = this;
          return {
            init: function () {
              this.on("addedfile", async function (file) {
                this.emit('complete', file);
                this.emit('success', file);

              });
              this.on('removedfile', function (file) {
                $vm.pre_labels_file_list.splice($vm.pre_labels_file_list.indexOf(file), 1);
                $vm.pre_labeled_data = null;
                $vm.pre_label_key_list = [];
              });
            },
            url: '/api/walrus/project/' + this.project_string_id + '/upload/large',
            chunking: true,
            addRemoveLinks: true,
            maxFiles: 1,
            autoProcessQueue: false,
            height: 120,
            thumbnailWidth: 80,
            thumbnailHeight: 80,
            maxFilesize: 5000,
            acceptedFiles: ".csv, .json"
          }

        },
      },
      watch: {
        $route(to, from) {
          // react to route changes...
          if(!to.query.step){
            this.el = 1;
            this.close();
          }
          else{
            this.el = to.query.step;
          }
        },
        el: function(newVal, oldVal){
          this.$router.push({query: {step: newVal}}).catch(() => {})
        }
      },
      mounted() {
        this.set_current_directory(this.$store.state.project.current_directory)
      },

      beforeDestroy() {

      },

      methods: {
        on_success_upload: function(){
          this.declare_success = true
          this.$emit('upload_success')
        },
        update_is_actively_sending: function(is_actively_sending){
          this.is_actively_sending = is_actively_sending
        },
        on_change_step: function (step) {
          const stepnum = parseInt(step, 10);
          if (stepnum === 3) {
            this.$refs.new_or_update_upload_screen.upload_source = undefined;
            this.$refs.new_or_update_upload_screen.with_prelabeled = undefined;
          }
          this.$router.push({query:{step: step}}).catch(()=>{});
        },
        set_upload_mode: function (mode) {
          this.upload_mode = mode;
          if (mode === 'new') {
            this.set_completed_questions(1);
          } else {
            this.set_completed_questions(1);
          }

          this.check_errors_and_go_to_step(2)
        },
        set_prelabeled_data: function(new_data){
          Object.freeze(new_data);
          this.pre_labeled_data = new_data;
        },
        set_completed_questions: function (value) {
          this.completed_questions = value;

        },
        update_progress_percentage: function (percent) {
          this.progress_percentage = percent
        },
        set_batch: function (batch) {
          this.batch = batch;
        },
        error_upload_connections: function (error) {
          console.error(error)
          this.connection_upload_error = error;
        },

        set_current_directory: function (current_directory) {
          this.current_directory = current_directory;
        },
        reset_total_files_size: function () {
          this.dropzone_total_file_size = 0;
        },
        file_removed: function(file){

          if (file.size && file.data_type != 'Annotations') {
            this.dropzone_total_file_size -= file.size;
          }
        },
        file_added: function (file) {
          if (file.size && file.data_type != 'Annotations') {
            this.dropzone_total_file_size += file.size;
          }
        },
        update_progress_values: function (file, total_bytes, uploaded_bytes) {
          this.currently_uploading_bytes = uploaded_bytes; // write totalBytes to dropzoneCurrentUpload
          this.per_file_progress = {
            ...this.per_file_progress,
              [file.upload.uuid]: uploaded_bytes
          }
          if (file.size <= uploaded_bytes) {
            this.currently_uploading_bytes = 0; // reset current upload bytes counter
          }
        },
        show_upload_progress_screen: function () {
          this.upload_in_progress = true;
        },
        upload_raw_media: async function (file_list) {
          this.$refs.new_or_update_upload_screen.upload_raw_media(file_list);
        },
        load_annotation_from_local: function (file, text_data) {

          if (file.type === 'application/json') {
            this.pre_labels_file_type = 'json';
            // Check max file size allowed
            const max_allowed_size = 800 * 1024 * 1024 // 800MB;
            const bytes = new TextEncoder().encode(text_data);
            const blob = new Blob([bytes], {
              type: "application/json;charset=utf-8"
            });
            const total_size = blob.size;
            if(total_size >= max_allowed_size){
              throw new Error('Annotations JSON Size limit is 800MB. Please use the SDK if you wish to process larger payloads.')
            }


            const parsed_data = JSON.parse(text_data);
            Object.freeze(parsed_data);

            this.pre_labeled_data = parsed_data
            const pre_label_keys = this.extract_pre_label_key_list(this.pre_labeled_data);
            this.pre_label_key_list = [...pre_label_keys];
            this.pre_labels_file_list.push(file);
          } else if (file.type === 'text/csv') {
            this.pre_labels_file_type = 'csv';
            let lines = text_data.split("\n");
            const headers = lines.shift().split(this.csv_separator)
            if (lines[lines.length - 1] == [""]) {
              lines.pop();
            }
            this.pre_label_key_list = headers;
            this.pre_labels_file_list.push(file);
            this.pre_labeled_data = lines.map(line => {
              const row = line.split(this.csv_separator)

              let obj = {};
              headers.forEach((h, i) => obj[h] = row[i]);
              return obj;
            })
            Object.freeze(this.pre_labeled_data)
          } else {
            throw new Error('Invalid file type for loading annotations')
          }
        },
        load_annotations_from_connection: async function () {
          const connector_id = this.$refs.new_or_update_upload_screen.incoming_connection.id;
          const directory_id = this.$store.state.project.current_directory.directory_id;
          const file = this.file_list_to_upload.filter(f => f.data_type === 'Annotations')[0];
          try {
            const response = await axios.post(`/api/walrus/v1/connectors/${connector_id}/fetch-data`, {
              opts: {
                action_type: 'get_string_data',
                path: file.id,
                bucket_name: this.$refs.new_or_update_upload_screen.bucket_name,
              },
              project_string_id: this.$props.project_string_id
            });

            if (response.status === 200) {
              const text_data = response.data.data;
              return text_data

            }

          } catch (error) {
            this.connection_upload_error = this.$route_api_errors(error);
            this.$emit('error_upload_connections', this.connection_upload_error)
            console.error(error);
          }
        },
        build_diffgram_export_ingestor: function(text_data, file){
          try{
            let export_data = JSON.parse(text_data);
            this.diffgram_export_ingestor = new DiffgramExportFileIngestor(export_data, file);
            return this.diffgram_export_ingestor

          }
          catch(error) {
            this.error_file_uploads = {};
            this.error_file_uploads['export_file'] = error.toString();
            return false;

          }

        },
        load_export_file: async function(){
          let export_file_list = this.file_list_to_upload.filter(f => f.data_type ===  'Diffgram Export');
          let file = export_file_list[0];
          if(export_file_list.length > 1){
            throw new Error('Just 1 Export Upload at a Time is supported.');
          }
          const text_data = await file.text();
          let diffgram_export_ingestor = await this.build_diffgram_export_ingestor(text_data, file);
          if(!diffgram_export_ingestor){
            return
          }
          this.$refs.diffgram_export_validator.validate_export_metadata();
          this.el = 4;
        },
        load_annotations_file: async function () {
          let file = this.file_list_to_upload.filter(f => f.data_type === 'Annotations')[0];
          this.$refs.new_or_update_upload_screen.loading_annotations = true;

          try {
            if (file.source === 'local') {
              const text_data = await file.text();
              await this.load_annotation_from_local(file, text_data);
            } else if (file.source === 'connection') {
              const text_data = await this.load_annotations_from_connection(file);
              this.load_annotation_from_local(file, text_data);

            } else {
              throw new Error('Invalid source type from file. Must be: "connection" or "local" ');
            }

            this.el = 4;
          } catch (error) {
            this.error_file_uploads = {}
            this.error_file_uploads['annotations_file'] = `${file ? file.name : undefined}: ${error.toString()}`;
            console.error(error);
          }
          this.$refs.new_or_update_upload_screen.loading_annotations = false;

        },
        file_list_updated: function (new_file_list) {
          this.file_list_to_upload = new_file_list;
        },
        close: function () {
          this.is_open = false;
          Object.assign(this.$data, get_initial_state());
          this.$emit('closed')
          this.$router.push({query: {}}).catch(()=>{});
        },

        async check_errors_and_go_to_step(step) {
          if (step === 5) {
            this.errors_file_schema = undefined;
            this.el = step;
          } else if (step === 6) {
            this.el = step
          } else if (step === 3) {
            this.set_completed_questions(2);
            this.el = step
          } else {
            this.el = step
          }
        },
        async update_sync_jobs_list(dir) {
          try {
            if (!dir || !dir.jobs_to_sync || !dir.jobs_to_sync.job_ids || !dir.jobs_to_sync.job_ids.length > 0) {
              return []
            }
            const response = await axios.post('/api/v1/job/list', {
              metadata: {
                mode_data: 'job_detail',
                builder_or_trainer: {
                  mode: 'builder'
                },
                project_string_id: this.$store.state.project.current.project_string_id,
                status: 'active',
                job_ids: dir.jobs_to_sync.job_ids
              }


            })

            if (response.data.Job_list) {
              return response.data.Job_list
            }
          } catch (error) {
            console.error(error);
          }
        },

        async on_change_directory(directory) {
          this.loading_sync_jobs = true;
          this.current_directory = directory;
          this.sync_job_list = await this.update_sync_jobs_list(directory)
          this.loading_sync_jobs = false;
          this.$emit('current_directory', this.current_directory)
        },
        extract_object_keys(obj, prepend = undefined){
          let result = [];
          for (const key in obj) {
            if(typeof obj[key] != 'object'){
              if (!result.includes(key)) {
                if(prepend){
                  result.push(prepend + key)
                }
                else{
                  result.push(key)
                }

              }
            }
            else{
              if(prepend){
                result.push(prepend + key)
              }
              else{
                result.push(key)
              }
              const nested_result = this.extract_object_keys(obj[key], `${ prepend ? `${prepend}${key}` : key}.`);
              result = result.concat(nested_result)
            }
          }
          return result
        },

        extract_pre_label_key_list: function (pre_labels_object) {
          const result = [];
          for (const elm of pre_labels_object) {
            const current_result = this.extract_object_keys(elm, undefined);
            for(const key of current_result){
              if(!result.includes(key)){
                result.push(key)
              }
            }
          }
          return result;
        },
        async open() {
          this.is_open = true;
        }
      }
    }
  ) </script>

<style>
  .v-stepper__wrapper {
    height: 100%;
  }
</style>
