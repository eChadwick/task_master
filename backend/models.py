from neomodel import (
    StructuredNode,
    StringProperty,
    get_config,
    DateProperty,
    RelationshipTo,
    RelationshipFrom,
    BooleanProperty,
)
from neomodel.exceptions import UniqueProperty

from config import settings

from error_messages import TaskErrors

get_config().database_url = settings.neomodel_cypher_connection_url


class Task(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    details = StringProperty(required=False)
    deadline = DateProperty(required=False)
    complete = BooleanProperty(default=False)

    is_part_of = RelationshipFrom("Task", "DEPENDS_ON")
    depends_on = RelationshipTo("Task", "DEPENDS_ON")
    blocks = RelationshipFrom("Task", "IS_BLOCKED_BY")
    is_blocked_by = RelationshipTo("Task", "IS_BLOCKED_BY")

    def save(self):
        duplicate = Task.nodes.filter(name__regex=f"(?i)^{self.name}$").all()
        if duplicate and duplicate[0].name != self.name:
            raise UniqueProperty("")

        if self.complete:
            for child in self.depends_on:
                if not child.complete:
                    raise ValueError(TaskErrors.DEPENDENCY_COMPLETE_VIOLATION)

            for child in self.is_blocked_by:
                if not child.complete:
                    raise ValueError(TaskErrors.DEPENDENCY_COMPLETE_VIOLATION)

        return super().save()
