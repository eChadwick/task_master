from neomodel import config, StructuredNode, StringProperty, get_config 

config = get_config()
config.database_url = "bolt://neo4j:password123@localhost:7687"

class Task(StructuredNode):
    name = StringProperty(unique_index=True, required=True)