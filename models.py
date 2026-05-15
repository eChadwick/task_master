from neomodel import config, StructuredNode, StringProperty

config.DATABASE_URL = "bolt://neo4j:password123@localhost:7687"

class Task(StructuredNode):
    name = StringProperty(unique_index=True, required=True)