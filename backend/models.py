from neomodel import (
    config,
    StructuredNode,
    StringProperty,
    get_config,
    DateProperty,
    RelationshipTo,
    RelationshipFrom
)

config = get_config()
config.database_url = "bolt://neo4j:password123@localhost:7687"


class Task(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    details = StringProperty(required=False)
    deadline = DateProperty(required=False)
    parents = RelationshipFrom('Task', 'DEPENDS_ON')
    children = RelationshipTo('Task', 'DEPENDS_ON')
