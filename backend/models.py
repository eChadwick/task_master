from neomodel import (
    StructuredNode,
    StringProperty,
    get_config,
    DateProperty,
    RelationshipTo,
    RelationshipFrom,
)

from config import settings

get_config().database_url = settings.neomodel_cypher_connection_url


class Task(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    details = StringProperty(required=False)
    deadline = DateProperty(required=False)
    is_part_of = RelationshipFrom("Task", "DEPENDS_ON")
    depends_on = RelationshipTo("Task", "DEPENDS_ON")
