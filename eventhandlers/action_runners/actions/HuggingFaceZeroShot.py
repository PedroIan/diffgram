from action_runners.base.ActionRunner import ActionRunner
from eventhandlers.action_runners.base.ActionTrigger import ActionTrigger
from eventhandlers.action_runners.base.ActionCondition import ActionCondition
from eventhandlers.action_runners.base.ActionCompleteCondition import ActionCompleteCondition
from shared.database.project import Project
from shared.database.task.task import Task
from shared.shared_logger import get_shared_logger
from shared.database.task.task import Task
from shared.database.source_control.file import File
from shared.database.project import Project
from shared.database.attribute.attribute_template_group import Attribute_Template_Group
from shared.annotation import Annotation_Update
import json
from transformers import pipeline

logger = get_shared_logger()


class HuggingFaceZeroShotAction(ActionRunner):
    public_name = 'Zero Shot Classification (Hugging Face)'
    description = 'Performs Zero Shot Classification for the text file'
    icon = 'https://huggingface.co/front/assets/huggingface_logo-noborder.svg'
    kind = 'hf_zero_shot'
    trigger_data = ActionTrigger(default_event='input_file_uploaded', event_list = ['input_file_uploaded', 'task_created'])
    condition_data = ActionCondition(default_event = 'action_completed',
                                     event_list = ['action_completed'])

    completion_condition_data = ActionCompleteCondition(default_event = 'action_completed',
                                                        event_list = ['action_completed'])
    category = 'nlp'

    def execute_pre_conditions(self, session) -> bool:
        return True

    def test_execute_action(self, session, file_id, connection_id):
        pass

    def execute_action(self, session, do_save_annotations=True) -> bool:
        event_name = self.action.trigger_data.get('event_name')
        file_id = self.event_data['file_id']
        project_id = self.action.config_data['project_id']
        group_id = self.action.config_data['group_id']

        task = None
        task_id = None

        if event_name == 'task_created':
            job_id = self.action.config_data['task_template_id']['id']
            task_id = self.event_data['task_id']
            task = Task.get_by_id(session=session, task_id=task_id)
            if task.job_id != job_id:
                return

            file_id = task.file_id

        file = File.get_by_id(session, file_id = file_id)

        if file.type != 'text':
            return

        if not project_id or  not group_id:
            return

        text = ''
        raw_sentences = json.loads(file.text_file.get_text())['nltk']['sentences']
        for sentence in raw_sentences:
            text += sentence['value']

        group_list = Attribute_Template_Group.list(
            session = session,
            group_id = group_id,
            project_id = project_id,
            return_kind = "objects",
            limit = None
        )

        group_list_serialized = []

        for group in group_list:
            group_list_serialized.append(group.serialize_with_attributes(session = session))

        candidate_attributes = [option['name'] for option in group_list_serialized[0]['attribute_template_list']]
        classifier = pipeline("zero-shot-classification")

        result = classifier(text, candidate_attributes)

        attribute_to_apply = result['labels'][result['scores'].index(max(result['scores']))]
        attribute_item_to_apply = [option for option in group_list_serialized[0]['attribute_template_list'] if option['name'] == attribute_to_apply][0]

        to_create = {
            "file_id": file_id if task == None else None,
            "task_id": task.id if task != None else None,
            "project_id": project_id,
            "type": 'global',
            "attribute_groups": {}
        }

        to_create['attribute_groups'][group_id] = attribute_item_to_apply

        project = Project.get_by_id(session=session, id=project_id)

        annotation_update = Annotation_Update(
            session = session,
            task = task,
            file = file,
            project = project,
            instance_list_new = [to_create],
            do_init_existing_instances = True
        )

        annotation_update.main() 

        return {
            "task_id": task_id,
            "file_id": file_id,
            "file_name": file.text_file.original_filename,
            "applied_option_id": attribute_item_to_apply['id'],
            "applied_option_label": attribute_to_apply
        }
