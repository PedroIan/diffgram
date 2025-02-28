<template>
  <div>
    <!--
    <v-btn data-cy="change_stats_visibility_button"
           @click="change_stats_visibility()"
           text>
      {{ stats_visibility ? "Hide" : "Show" }} panel
    </v-btn>
    -->
    <v-layout v-if="stats_visibility">
      <v-col cols="12" sm="4">
        <v-card class="mx-auto info-style" outlined>
          <h3>Job progress:</h3>
          <div v-if="job_data_fetched" style="width: 50%">
            <pie-chart
              :data="job_chart.chartData"
              :options="job_chart.chartOptions"
            />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="mx-auto info-style" outlined>
          <h3>My progress:</h3>
          <br />
          <br />
          <div v-if="job_data_fetched" style="width: 80%">
            <span style="display: flex; justify-content: space-between">
              Total tasks assigned:
              <strong>{{ current_user_performance.total }}</strong>
            </span>
            <br />
            <span style="display: flex; justify-content: space-between">
              Tasks completed:
              <strong>{{ current_user_performance.completed }}</strong>
            </span>
            <br />
            <span style="display: flex; justify-content: space-between">
              Annotations created:
              <strong>{{ current_user_performance.instances }}</strong>
            </span>
            <br />
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="mx-auto info-style" outlined>
          <member_select
            id="member_select"
            v-model="member_list_selected"
            :initial_value="this.$store.state.user.current.id"
            :init_all_selected="false"
            label="Select User"
            :show_names_on_selected="true"
            @change="switch_user"
            :allow_all_option="false"
            :member_list="member_list"
          ></member_select>
          <div v-if="!update_user_cart && job_data_fetched"  style="width: 50%;">
            <pie-chart
              :data="user_stats.chartData"
              :options="user_stats.chartOptions"
            />
          </div>
        </v-card>
      </v-col>
    </v-layout>
  </div>
</template>

<script>
import Vue from "vue";
import pieChart from "../report/charts/pieChart";
import store from "../../store";
import user_icon from "../user/user_icon.vue";
import {
  getJobStats,
  getJobStatsForUser,
} from "../../services/jobStatsServices";

export default Vue.extend({
  components: {
    pieChart,
    user_icon,
  },
  store,
  watch: {
    update_user_cart: {
      async handler(value) {
        if (value) this.update_user_chart();
      },
    },
  },
  computed: {
    current_user() {
      const user = this.member_list.find(
        (item) => item.id === this.show_member_stat
      );
      return user;
    },
  },
  methods: {
    change_stats_visibility() {
      this.stats_visibility = !this.stats_visibility;
      localStorage.setItem("diff_stats_task_visibility", this.stats_visibility);
    },
    async update_user_chart() {
      const { job_id } = this.$route.params;
      if(!job_id){
        return
      }
      const { completed, total, in_progress, in_review, requires_changes, instances_created } = await getJobStatsForUser(job_id, this.show_member_stat);
      const pending = total - completed - in_progress - in_review - requires_changes
      this.user_stats.chartData.datasets[0].data = [completed, in_progress, in_review, requires_changes, pending];
      this.user_stats.chartData.labels = [
        `Completed ${completed}`,
        `In progress ${in_progress}`,
        `In review ${in_review}`,
        `Require changes ${requires_changes}`,
        `Pending ${pending}`,
      ];
      if (!this.job_data_fetched) {
        this.current_user_performance = {
          instances: instances_created,
          total: total,
          completed: completed,
        };
      }
      this.update_user_cart = false;
    },
    switch_user(id) {
      this.show_member_stat = id;
      this.update_user_cart = true;
    },
  },
  async created() {
    const stats_visibility_status = localStorage.getItem(
      "diff_stats_task_visibility"
    );

    if (stats_visibility_status)
      this.stats_visibility = JSON.parse(stats_visibility_status);

    const user_id = this.$store.state.user.current.id;

    const { job_id } = this.$route.params;
    this.member_list = [...this.$store.state.project.current.member_list];
    this.show_member_stat = user_id;
    this.member_list_selected = user_id;
    const { completed, total, in_progress, in_review, requires_changes } = await getJobStats(job_id);
    const pending = total - completed - in_progress - in_review - requires_changes
    this.job_chart.chartData.datasets[0].data = [completed, in_progress, in_review, requires_changes, pending];
    this.job_chart.chartData.labels = [
      `Completed ${completed}`,
      `In progress ${in_progress}`,
      `In review ${in_review}`,
      `Require changes ${requires_changes}`,
      `Pending ${pending}`,
    ];

    await this.update_user_chart();

    this.job_data_fetched = true;
  },
  data() {
    return {
      stats_visibility: true,
      current_user_stat: "two",
      update_user_cart: false,
      job_data_fetched: false,
      member_list: [],
      member_list_selected: null,
      show_member_stat: null,
      current_user_performance: {
        instances: 0,
        total: 0,
        completed: 0,
      },
      job_chart: {
        chartOptions: {
          hoverBorderWidth: 20,
          tooltips: {
            enabled: false,
          },
        },
        chartData: {
          hoverBackgroundColor: "red",
          hoverBorderWidth: 10,
          labels: ["Completed", "Pending"],
          datasets: [
            {
              backgroundColor: ["#6ab04c", "#ffbe76", '#7ed6df', '#eb4d4b', '#95afc0'],
              data: [],
            },
          ],
        },
      },
      user_stats: {
        chartOptions: {
          hoverBorderWidth: 20,
          tooltips: {
            enabled: false,
          },
        },
        chartData: {
          hoverBackgroundColor: "red",
          hoverBorderWidth: 10,
          labels: ["Completed", "Pending"],
          datasets: [
            {
              label: "Data One",
              backgroundColor: ["#6ab04c", "#ffbe76", '#7ed6df', '#eb4d4b', '#95afc0'],
              data: [],
            },
          ],
        },
      },
    };
  },
});
</script>

<style scoped>
.info-style {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 350px;
}

.user-item {
  display: flex;
  flex-direction: row;
  cursor: pointer;
}

@media screen and (max-width: 1500px) {
  .info-style {
    height: 250px;
  }
}
</style>
