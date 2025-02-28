
<template>
  <div class="d-flex align-center justify-center screen-height" v-cloak v-if="render_default_login">

    <v-flex class="flex-column" xs6 center v-if="$store.state.user.logged_in != true">
      <v_error_multiple :error="error_login"></v_error_multiple>
      <div class="pa-4 ma-auto text-center" style="width: 100%">
        <img
          src="https://storage.googleapis.com/diffgram-002/public/logo/diffgram_logo_word_only.png"
          height="120px"
        />
      </div>
      <v-card>
        <v-card-title primary-title>
          <div>
            <h3 class="headline mb-0">Login to Diffgram</h3>
          </div>
        </v-card-title>

        <v-alert type="error" v-if="error.rate_limit">
          {{ error.rate_limit }}
        </v-alert>

        <v-alert type="error" v-if="error.magic">
          {{ error.magic }}
        </v-alert>

        <div v-if="!show_otp_prompt">
          <v-container>
            <form>
              <v-text-field
                :disabled="loading"
                required
                data-cy="email"
                label="Email"
                v-model="email"
                validate-on-blur
                :rules="[rules.email]"
              >
              </v-text-field>

              <v-alert type="warning" v-if="error.email">
                {{ error.email }}
              </v-alert>

              <v-text-field
                v-if="mode == 'password'"
                required
                data-cy="password"
                :append-icon="e1 ? 'visibility' : 'visibility_off'"
                @click:append="() => (e1 = !e1)"
                :type="e1 ? 'password' : 'text'"
                label="Password"
                id="password"
                v-model="password"
              >
              </v-text-field>
            </form>
            <v-alert type="error" v-if="error.password">
              {{ error.password }}
            </v-alert>

            <v-layout>
              <v-btn
                v-if="mode == 'password'"
                @click="login"
                large
                color="primary"
                :loading="loading"
                data-cy="login"
                @click.native="loader = 'loading'"
                :disabled="loading"
              >
                Login
              </v-btn>

              <div class= "pl-2">
                <v-btn
                  large
                  v-if="mailgun"
                  @click="start_magic_login_api"
                  color="primary"
                  :loading="loading"
                  @click.native="loader = 'loading'"
                  :disabled="loading"
                >
                  <v-icon left>mdi-auto-fix</v-icon>
                  Send Magic Link
                </v-btn>
                <v-btn
                  large
                  v-if="mode != 'password'"
                  color="blue darken-1"
                  id="show_pass"
                  data-cy="type-password-btn"
                  :disabled="loading"
                  text
                  @click="mode = 'password'"
                >
                  Use password
                </v-btn>
               </div>
            </v-layout>

            <br />

              <v-layout>

                 <v-spacer></v-spacer>

                <v-btn
                  @click="route_oauth2_login"
                  v-if="show_oauth2"
                  color="secondary"
                  outlined
                  class="mr-4"
                  :loading="loading"
                  :disabled="loading"
                >
                  <v-icon left>mdi-web</v-icon>
                  Login with SSO
                </v-btn>


                <v-btn
                  @click="route_account_new"
                  color="success"
                  outlined
                  :loading="loading"
                  @click.native="loader = 'loading'"
                  :disabled="loading"
                >
                  <v-icon left>mdi-plus</v-icon>
                  Create User
                </v-btn>

                <tooltip_button
                    tooltip_message="Join Slack Community"
                    href="https://form.jotform.com/222377866413058"
                    target="_blank"
                    icon="mdi-slack"
                    :icon_style="true"
                    color="primary">
                </tooltip_button>

                <tooltip_button
                    tooltip_message="Help"
                    href="https://diffgram.readme.io/docs/login-magic-login-and-password-setting"
                    target="_blank"
                    icon="mdi-lifebuoy"
                    :icon_style="true"
                    color="primary">
                </tooltip_button>
              </v-layout>
          </v-container>
        </div>

        <div v-if="show_otp_prompt">
          <v-container>
            <h3>2 Factor Authentication</h3>

            <v-text-field required label="One time code" v-model="otp">
            </v-text-field>

            <v-alert type="error" v-if="error.otp">
              {{ error.otp }}
            </v-alert>

            <v-card-actions>
              <!-- <v-btn text color="orange">Settings</v-btn> -->

              <v-btn
                @click="otp_verify"
                color="primary"
                :loading="loading"
                :disabled="loading"
              >
                Verify
              </v-btn>
            </v-card-actions>
          </v-container>
        </div>

        <v-alert type="success" v-if="start_magic_login_success">
          {{ start_magic_login_success }}
        </v-alert>
      </v-card>
    </v-flex>

    <div
      v-if="
        $store.state.user.logged_in == true && show_logging_in_messsage == false
      "
    >
      <v-alert type="info"> Already Logged In. </v-alert>

      <v-btn x-large color="success"><v-icon>mdi-home</v-icon>Go to Dashboard</v-btn>
    </div>

    <div
      v-if="
        $store.state.user.logged_in == true && show_logging_in_messsage == true
      "
    >
      <v-progress-linear
        height="10"
        indeterminate
        absolute
        top
        color="secondary accent-4"
      >
      </v-progress-linear>

      <v-alert type="info"> Logging in... </v-alert>
    </div>
  </div>
</template>

<script lang="ts">
import axios from "../../services/customInstance";
import { is_mailgun_set, is_oauth2_set } from "../../services/configService";

import Vue from "vue";
export default Vue.extend({
  name: "user_login",
  props: {
    magic_auth: {
      default: null,
    },
    no_redirect: {
      default: null,
    },
  },
  data() {
    return {
      loading: false,
      render_default_login: false,

      e1: true,
      show_oauth2: false,

      email: null,
      mailgun: undefined,

      mode: "loading",
      oauth_login_url: null,
      show_logging_in_messsage: false,

      error: {
        email: null,
        otp: null,
        password: null,
        rate_limit: null,
        magic: null,
      },

      start_magic_login_success: null,
      error_login: null,

      otp: null,
      otp_current_session: null,

      show_otp_prompt: false,

      password: null,

      rules: {
        required: (value) => !!value || "Required.",
        email: (value) => {
          const pattern =
            /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
          return pattern.test(value) || "Invalid e-mail.";
        },
      },
    };
  },
  async created() {
    if (window.Cypress) {
      window.LoginComponent = this;
    }

    if (this.$store.state.user.logged_in == true){
      if ("redirect" in this.$route.query) {
        this.$router.push(this.$route.query["redirect"]);
      }
      else{
        this.$router.push('/home/dashboard');
      }
    }

    window.addEventListener("keyup", this.keyboard_events);
    const { mailgun } = await is_mailgun_set();
    const { use_oauth2, login_url } = await is_oauth2_set();
    if(use_oauth2){
      // window.location.replace();
      // return
      this.oauth_login_url = login_url
      this.show_oauth2 = true
    }
    this.render_default_login = true;
    this.mailgun = mailgun;
    this.mode = mailgun ? "magic_auth" : "password";

    if (this.magic_auth) {
      if (this.$store.state.user.logged_in != true) {
        this.mode = "magic_auth_redeem";
        this.login();
      }
    }
  },
  destroyed() {
    window.removeEventListener("keyup", this.keyboard_events);
  },
  methods: {
    route_oauth2_login: function(){
      window.location.replace(this.oauth_login_url);
      // this.$router.push(this.oauth_login_url);
    },
    route_account_new: function () {
      this.$router.push("/user/new");
    },
    start_magic_login_api: function () {
      this.loading = true;

      this.error = {
        email: null,
        auth: null,
        rate_limit: null,
      };

      this.start_magic_login_success = false;

      axios
        .post("/api/user/login/magic/start", {
          email: this.email,
        })
        .then((response) => {
          this.loading = false;

          if (response.data.log.success == true) {
            this.start_magic_login_success = "Check your email.";
          } else {
            this.error = response.data.log.error;
          }
        })
        .catch((error) => {
          this.loading = false;

          if (error.response) {
            if (error.response.status == 400) {
              this.error = error.response.data.log.error;
            }

            if (error.response.status == 429) {
              this.error.rate_limit =
                "Too many requests, please try again later.";
            }
          }
        });
    },
    login: function () {
      this.loading = true;

      this.error = {
        email: null,
        otp: null,
        password: null,
        rate_limit: null,
        magic: null,
      };

      axios
        .post("/api/user/login", {
          mode: this.mode,
          email: this.email,
          password: this.password,
          auth_code: this.magic_auth,
        })
        .then((response) => {
          this.loading = false;

          if (response.data.log.success == true) {
            this.password = null;

            if (response.data.otp_prompt == true) {
              this.show_otp_prompt = true;
              this.email = response.data.user_email;
              this.otp_current_session = response.data.otp_current_session;
            } else {
              this.do_login(response);
            }
          } else {
            this.error = response.data.log.error;
          }
        })
        .catch((error) => {
          this.loading = false;
          this.error_login = this.$route_api_errors(error)
          if (error.response) {
            if (error.response.status == 400) {
              this.error = error.response.data.log.error;
            }

            if (error.response.status == 429) {
              this.error.rate_limit =
                "Rate Limited. Too many requests, please try again later.";
            }
          }
        });
    },
    otp_verify: function () {
      this.loading = true;

      axios
        .post("/api/user/otp/verify", {
          email: this.email,
          otp: this.otp,
          otp_current_session: this.otp_current_session,
        })
        .then((response) => {
          this.loading = false;

          if (response.data["success"] == true) {
            this.do_login(response);
          } else {
            this.otp_error = response.data["error"];
          }
        })
        .catch((error) => {
          console.error(error);
          this.loading = false;
        });
    },
    keyboard_events: function (event) {
      if (event.keyCode === 13) {
        // enter

        if (this.show_otp_prompt == true) {
          this.otp_verify();
        } else {
          this.login();
        }
      }
    },
    do_login: function (response) {
      this.show_logging_in_messsage = true;

      this.$store.commit("log_in");
      //this.$store.commit('set_user_name', this.email)

      if (response.data.user.last_builder_or_trainer_mode == "trainer") {
        this.$store.commit("set_mode_trainer");
      }
      if (response.data.user.last_builder_or_trainer_mode == "builder") {
        this.$store.commit("set_mode_builder");
      }
      let user = {
        ...response.data.user,
        install_fingerprint: response.data.install_fingerprint
      }
      this.$store.commit("set_current_user", user);

      // Not sure if need an if check here, but may rely on org being a dict,
      // and could be None?
      if (response.data.user.org_default) {
        // TODO not clear if null check is needed here
        if (response.data.user.org_default != null) {
          this.$store.commit("set_org", response.data.user.org_default);
        }
      }

      //this.$store.commit('set_user_projects', response.data['user']['projects'])

      if (this.no_redirect == true) {
      } else {
        if ("redirect" in this.$route.query) {
          this.$router.push(this.$route.query["redirect"]);
        } else {
          /*
           * CAUTION
           *  if the user is being redirected, then the project_string_id should
           *  load from that redirection.
           *  Otherwise race condition as it trys to commit the user's "current" project
           *  which may be diferent.
           *  ie current project "apples" but redirect link (ie share link in email) is "pears"
           *
           *  Note, this assumes follow on component will set project,
           *  see https://diffgram.teamwork.com/#/tasks/20231172 for more
           *
           */

          // would like to only use "project_current" syntax
          // TODO update all methods using the old name / project string directly
          // to use current project dict (and then call the property wanted) instead
          let project_current = response.data.user.project_current;
          if (project_current) {
            this.$store.commit(
              "set_project_string_id",
              project_current.project_string_id
            );
            this.$store.commit("set_project_name", project_current.name);
            this.$store.commit("set_project", project_current);
          }

          this.$router.push("/home/dashboard");

          /*
          if (current_project_string_id == null) {
            this.$router.push('/home/dashboard')
          } else {
            this.$router.push('/studio/annotate/' + current_project_string_id)
          }
          */
        }
      }
    },
  },
});
</script>
