from neomodel import (
    config,
    StructuredNode,
    StringProperty,
    get_config,
    DateProperty,
    RelationshipTo,
)

config = get_config()
config.database_url = "bolt://neo4j:password123@localhost:7687"


class Task(StructuredNode):
    name = StringProperty(unique_index=True, required=True)
    details = StringProperty(required=False)
    deadline = DateProperty(required=False)
    parent_names = RelationshipTo('Task', 'IS_PART_OF')
