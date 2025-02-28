<template>

  <div v-if="point_cloud_mesh"
       :id="container_id"
       @focusin="on_focus_canvas"
       @focusout="on_focus_out_canvas"
       :style="{width: `${width}px`, height: `${height}px`}" class="ma-0">

  </div>

</template>

<script lang="ts">
  import {WEBGL} from "./WebGL";
  import Vue from "vue";
  import * as THREE from "three";
  import AnnotationScene3D from './AnnotationScene3D';
  import AnnotationScene3DOrtographicView from './AnnotationScene3DOrtographicView';
  import { PCDLoader } from './PCDLoader.js';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

  export default Vue.extend({
      name: 'canvas_3d',
      components: {},
      props: {
        point_cloud_mesh:{
          default: null,
          type: Object
        },
        width: {
          default: 'auto'
        },
        height: {
          default: 'auto'
        },
        camera_type: {
          default: 'perspective'
        },
        create_new_scene: {
          default: true
        },
        with_keyboard_controls: {
          default: false
        },
        current_label_file: {
          default: false
        },
        allow_navigation: {
          default: false
        },
        pcd_url: {
          default: null
          // default: "https://diffgrampublic1.s3.amazonaws.com/Zaghetto.pcd"
        },
        radar_url: {
          default: null
        },
        instance_list: {
          default: () => ([])
        },
        container_id: {
          default: '3d-container'
        },
        draw_mode: {
          default: false
        },
        zoom_speed:{
          default: 1
        },
        pan_speed:{
          default: 1
        }

      },
      data() {
        return {
          controls_transform: null,
          percentage: 0,
          controls_orbit: null,
          loading_pcd: true,
          renderer: null,
          container: null,
          scene_controller: null,
          camera: null,
        }
      },

      async mounted() {
        this.container = document.getElementById(this.$props.container_id)
        if(this.camera_type === 'perspective'){
          window.addEventListener('keydown', this.on_key_down);
          document.addEventListener('click', function(event) {
            if(!component_ctx.renderer || !component_ctx.renderer.domElement){
              return
            }
            if (event.target === component_ctx.renderer.domElement) {
              component_ctx.scene_controller.add_orbit_controls_events();
            }
            else{
              component_ctx.scene_controller.remove_orbit_controls_events();
            }
          });
        }

        await this.load_canvas();

        let component_ctx = this;


        // FOR TESTING PCD LOADING ISSUE:
        // Uncomment this and comment the code above, this should display a basic figure with the pcd loader.
        // let renderer, scene, camera;
        // let container = document.getElementById(this.$props.container_id)
        // renderer = new THREE.WebGLRenderer( { antialias: true } );
        // renderer.setPixelRatio( window.devicePixelRatio );
        // renderer.setSize( container.clientWidth,  container.clientHeight );
        //
        //
        // document.body.appendChild( renderer.domElement );
        //
        // scene = new THREE.Scene();
        // scene.background = new THREE.Color('blue')
        // camera = new THREE.PerspectiveCamera( 30, container.clientWidth / container.clientHeight, 0.01, 40 );
        // camera.position.set( 0, 0, 1 );
        // scene.add( camera );
        //
        // const controls = new OrbitControls( camera, renderer.domElement );
        // controls.addEventListener( 'change', render ); // use if there is no animation loop
        // controls.minDistance = 0.5;
        // controls.maxDistance = 10;
        //
        // //scene.add( new THREE.AxesHelper( 1 ) );
        //
        // const loader = new PCDLoader();
        // loader.load( 'https://diffgramstaging.blob.core.windows.net/testpablo/projects/pcd/7/76?st=2021-11-16T17%3A08%3A29Z&se=2023-01-10T17%3A08%3A29Z&sp=rt&sv=2020-06-12&sr=b&rscd=attachment%3B%20filename%3D76&sig=leCde9ZLeXA5pyOa7p/pB6ysQlnXJwps4gUy6SglW/k%3D', function ( points ) {
        //
        //   points.geometry.center();
        //   points.geometry.rotateX( Math.PI );
        //   scene.add( points );
        //
        //   render();
        //
        // } );
        // function render() {
        //
        //   renderer.render( scene, camera );
        //
        // }


      },
      beforeDestroy() {
        if (this.scene_controller) {
          this.destroy_canvas();
        }
        if(this.camera_type === 'perspective'){
          window.removeEventListener('keydown', this.on_key_down);
        }

      },
      computed: {

      },
      watch:{
        zoom_speed: function(new_val, old_val){
          this.update_zoom_speed(new_val)
        },
        pan_speed: function(new_val, old_val){
          this.update_pan_speed(new_val)
        },
        width: function(){
          this.update_camera_aspect_ratio();
        },
        height: function(){
          this.update_camera_aspect_ratio();
        }
      },
      methods: {
        on_focus_canvas: function(){
          if(this.scene_controller){
            this.scene_controller.add_orbit_controls_events();
          }

        },
        on_focus_out_canvas: function(){
          if(this.scene_controller){
            this.scene_controller.remove_orbit_controls_events();
          }
        },
        on_key_down: function(event){
          if(event.keyCode == 88){ // c key
            this.center_camera();
          }
        },
        load_canvas: async function(){
          if (WEBGL.isWebGLAvailable()) {
            if (this.$props.create_new_scene) {

              await this.setup_scene()
            }
          } else {
            const warning = WEBGL.getWebGLErrorMessage();
            alert('WebGL is not available on this machine.')

          }
        },
        destroy_canvas: function(){
          if(this.scene_controller){
            // Clear all elements from the scene
            this.scene_controller.detach_mouse_events();
            this.scene_controller.scene.remove(this.point_cloud_mesh);
            this.scene_controller.remove_orbit_controls_events();
            this.point_cloud_mesh.geometry.dispose();
            this.point_cloud_mesh.material.dispose();

            this.scene_controller.clear_all();

            let container = document.getElementById(this.$props.container_id)
            if(container && this.renderer){
              if(container.contains(this.renderer.domElement)){
                document.getElementById(this.$props.container_id).removeChild(this.renderer.domElement);
              }

            }

            delete this.renderer;
            delete this.scene_controller.scene;

            this.renderer = undefined;
            this.point_cloud_mesh = undefined;

            this.scene_controller = undefined;
          }
        },
        update_pan_speed: function(){
          this.scene_controller.controls_orbit.panSpeed = this.$props.pan_speed;
          this.scene_controller.controls_orbit.update();
        },
        update_zoom_speed: function(){
          this.scene_controller.controls_orbit.zoomSpeed = this.$props.zoom_speed;
          this.scene_controller.controls_orbit.update();
        },
        setup_ortographic_scene_controller: function (scene) {
          this.camera = new THREE.OrthographicCamera(
            -20,
            20,
            -20,
            20,
            0.1,
            1000);
          this.scene_controller = new AnnotationScene3DOrtographicView(scene,
            this.camera,
            this.renderer,
            this.container,
            this,
            this.$props.instance_list,
            60,
            this.point_cloud_mesh)
          this.scene_controller.attach_mouse_events();

          this.scene_controller.set_draw_mode(this.$props.draw_mode);
          this.scene_controller.set_current_label_file(this.$props.current_label_file);

        },
        setup_perspective_scene_controller: function (scene) {
          if(!this.container){
            return
          }
          this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 1000);
          this.scene_controller = new AnnotationScene3D(scene,
            this.camera,
            this.renderer,
            this.container,
            this,
            this.$props.instance_list,
            60,
            this.point_cloud_mesh)
          this.scene_controller.attach_mouse_events();
          this.scene_controller.set_draw_mode(this.$props.draw_mode);
          this.scene_controller.set_current_label_file(this.$props.current_label_file);
        },
        create_renderer: function(){
          if(!this.container){
            return
          }
          this.renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true});
          this.renderer.setPixelRatio(window.devicePixelRatio);

          this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);

        },
        setup_scene: async function (scene = undefined,) {

          this.container = document.getElementById(this.$props.container_id)

          if(!this.container){
            return
          }
          if(this.container.clientWidth === 0 || this.container.clientHeight === 0){
            return
          }
          if(!this.renderer){
            this.create_renderer();
          }
          window.addEventListener( 'resize', this.on_window_resize );
          let scene_created = false;
          if (!scene) {
            scene = new THREE.Scene();
            scene_created = true;
            // scene.background = new THREE.Color('blue')
          }

          document.getElementById(this.$props.container_id).appendChild(this.renderer.domElement);

          // Disable selecting text when double clicking inside canvas
          // see: https://stackoverflow.com/questions/3684285/how-to-prevent-text-select-outside-html5-canvas-on-double-click
          this.renderer.domElement.onselectstart = function () { return false; }

          if (this.$props.camera_type === 'perspective') {
            this.setup_perspective_scene_controller(scene);
            this.configure_controls();

          } else if (this.$props.camera_type === 'ortographic') {
            this.setup_ortographic_scene_controller(scene)
          }

          if(scene_created){
            this.scene_controller.add_mesh_to_scene(this.point_cloud_mesh)
            this.scene_controller.start_render();
            this.add_instance_list_to_scene();
          }


          this.$emit('scene_ready', this.scene_controller)
        },
        set_current_label_file: function (label_file) {
          if(!this.scene_controller){
            return
          }
          this.scene_controller.set_current_label_file(label_file)
        },
        set_draw_mode: function (draw_mode) {
          this.scene_controller.set_draw_mode(draw_mode);
        },
        add_instance_list_to_scene: function () {
          for (const instance of this.$props.instance_list) {
            instance.draw_on_scene();
          }
        },
        update_camera_aspect_ratio: function(){
          if(!this.camera){
            return
          }
          if(!this.renderer){
            return
          }


          let w = this.container.clientWidth
          let h = this.container.clientHeight
          this.camera.aspect = w / h;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(w, h);
        },
        on_window_resize: function () {
          this.update_camera_aspect_ratio();
        },
        center_camera: function(){
          this.scene_controller.center_camera_to_mesh(this.point_cloud_mesh)
        },
        configure_controls: function () {
          if (!this.$props.allow_navigation) {
            return
          }

          this.scene_controller.add_orbit_controls();
          this.scene_controller.controls_orbit.zoomSpeed = this.$props.zoom_speed;
          this.scene_controller.controls_orbit.panSpeed = this.$props.pan_speed;
          this.scene_controller.add_transform_controls();



        },


      }
    }
  ) </script>
