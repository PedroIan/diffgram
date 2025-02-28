<template>
  <div class="d-flex align-center justify-center screen-height" v-cloak>
  <v-flex xs6 center>
    <v-card>

        <div class="pt-4  ma-auto text-center" style="width: 100%">
          <img
            src="https://storage.googleapis.com/diffgram-002/public/logo/diffgram_logo_word_only.png"
            height="60px"
          />
        </div>

        <v-card-title primary-title>
          <div>
            <h3 class="headline mb-0">Create your free Diffgram account</h3>
          </div>
        </v-card-title>

        <v-container>

        <v_error_multiple :error="error"
                          data-cy="error-email">
        </v_error_multiple>

        <v-text-field label="Email"
                      v-model="email"
                      data-cy="email-input"
                      validate-on-blur
                      :rules="[rules.email]"
                      :disabled="loading"
                      >
        </v-text-field>

        <v-text-field
          :append-icon="password_hide ? 'visibility' : 'visibility_off'"
          @click:append="() => (password_hide = !password_hide)"
          :type="password_hide ? 'password' : 'text'"
          label="Password"
          data-cy="password1"
          validate-on-blur
          :rules="[rules.password]"
          v-model="password"
          :disabled="loading"
        />

        <v-text-field
            :append-icon="password_hide_check ? 'visibility' : 'visibility_off'"
            @click:append="() => (password_hide_check = !password_hide_check)"
            :type="password_hide_check ? 'password' : 'text'"
            label="Retype Password"
            validate-on-blur
            data-cy="password2"
            :rules="[password_checker]"
            v-model="password_check"
            :disabled="loading"
        />

        <v-card-actions>
          <v-btn color="primary"
                 x-large
                 data-cy="create-user-button"
                 :loading="loading"
                 @click="new_user"
                 :disabled="loading">
            Create
          </v-btn>

          <v-spacer></v-spacer>

          <v-btn
            @click="route_account_login"
            color="primary"
            text
            @click.native="loader = 'loading'"
            :disabled="loading"
          >
            Login
          </v-btn>

          <tooltip_button
              tooltip_message="Join Slack Community"
              href="https://form.jotform.com/222377866413058"
              target="_blank"
              icon="mdi-slack"
              :icon_style="true"
              color="primary">
          </tooltip_button>
        </v-card-actions>
    </v-container>

    <v-progress-linear
      v-if="loading"
      attach
      indeterminate
      height="20">

    </v-progress-linear>

  </v-card>
  </v-flex>

  </div>
</template>

<script lang="ts">

  import axios from '../../../services/customInstance';
  import {getProject} from '../../../services/projectServices'
  import {auth_redirect} from './auth_redirect'
  import Vue from "vue";

  export default Vue.extend( {
    name: 'user_data_platform_new',
    data() {
      return {
        loading: false,

        email: "",
        error: {},

        user_kind: null,

        signup_code: null, // Optional
        error_signup_code: null,
        project_string_id: null,
        password: null as String,
        password_hide: true,

        password_check: null as String,
        password_hide_check: true,

        rules: {
          required: (value) => !!value || 'Required.',
          email: (value) => {
            const pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
            return pattern.test(value) || 'Invalid e-mail.'
          },
          password: (value) => {
            const pattern = /^.{8,200}$/
            if (!pattern.test(value)) {
              return '8 to 200 characters'
            }
            return true
          },

        }

      }
    },

    computed: {

    },

    created() {

      this.$store.commit('set_mode_builder')

      this.user_kind = this.$route.query["user_kind"]

      this.email = this.$route.query["email"]
      this.signup_code = this.$route.query["code"]
      this.project_string_id = this.$route.query["project"]

      // log out by default (if logged in) since we will be putting a new  cookie here
      // and edge case but would be strange if made new account and then didn't change
      // account stuff properly
      if (this.$store.state.user.logged_in == true) {
        this.logout()
      }
    },

    methods: {
      password_checker: function (value) {

        // Run equals check first
        if (this.password != this.password_check) {
          return "Passwords must match"
        }

        // Don't need to rerun password check
        // since if they equal, and the first password as checked
        // then all clear
        return true
      },
      route_account_login: function () {
        this.$router.push("/user/login");
      },
      logout: function () {
        axios.get('/user/logout')
          .then(response => {
            this.$store.dispatch('log_out')
          })
          .catch(error => {
            console.error(error);
          });
      },
      new_user: async function () {

        this.error = {}

        // Local test to avoid API call (spam). Note super happy with this here.
        if (this.email == undefined) {
          this.error['email'] = "Please enter an email"
          return
        }

        this.loading = true;
        try{
          let response = await axios.post('/api/v1/user/new', {
            'email': this.email,
            'signup_code': this.signup_code,
            'password': this.password,
            'password_check': this.password_check
          });
          console.log('')
          this.$store.commit('log_in');
          this.$store.commit('set_user_name', this.email)

          if (response.data.user) {
            this.$store.commit('set_current_user', response.data.user)
          }

          // careful must return after matching
          // routing condition otherwise goes to next value one...

          if (this.user_kind == "annotator_signup") {
            this.$router.push('/user/trainer/signup')
            return
          }

          let auth = response.data.log.auth

          auth_redirect(auth, response.data.project_string_id, this.$router, this.$store)
        }
        catch(e){
          console.error(e)
          if (typeof  this.$route_api_errors(e) === 'object'){
            this.error = this.$route_api_errors(e)
          }
          else {
            this.error = {'error': this.$route_api_errors(e)}
          }

          this.loading = false

        }
      }
    }
  }

) </script>
