import axios from './customInstance'

export const get_action_stat = async (project_string_id, action_id) => {
    try {
        const { data } = await axios.get(`/api/v1/project/${project_string_id}/action/${action_id}`)
        return data
    } catch(e) {
        return null
    }
}

export const get_action_run_list = async (project_string_id, action_id) => {
  try {
    const { data } = await axios.get(`/api/v1/project/${project_string_id}/action/${action_id}/runs/list`)
    return [data.action_run_list, null]
  } catch(e) {
    return [null, e]
  }
}
